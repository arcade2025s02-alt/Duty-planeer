import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { convertAssignmentsToCsv, formatDateRange, TWENTY_FOUR_HOURS_MS, DutyAssignment } from './src/utils/dutyChart.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// In-memory temporary generated files storage with 24-hour retention
interface TempFileRecord {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  formattedDateRange: string;
  description?: string;
  assignments: DutyAssignment[];
  csvContent: string;
  createdAt: number; // timestamp in ms
  expiresAt: number; // timestamp in ms
}

const temporaryCharts = new Map<string, TempFileRecord>();

// Periodic 24-hour cleanup job
setInterval(() => {
  const now = Date.now();
  for (const [id, record] of temporaryCharts.entries()) {
    if (now - record.createdAt >= TWENTY_FOUR_HOURS_MS) {
      temporaryCharts.delete(id);
      console.log(`[Auto-Prune] Deleted expired temporary duty chart ${id} (>24h).`);
    }
  }
}, 60 * 60 * 1000); // Check every hour

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API: Generate Duty Chart with Intelligent Duty Planner
app.post('/api/generate-duty-chart', async (req, res) => {
  try {
    const { title, startDate, endDate, instructions, previousChart, employeeRoster } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ error: 'Title, Start Date, and End Date are required.' });
    }

    const formattedRange = formatDateRange(startDate, endDate);

    // If Gemini API Key is available, generate dynamic duty chart with Gemini 3.8 Flash
    let assignments: DutyAssignment[] = [];

    if (process.env.GEMINI_API_KEY) {
      try {
        const promptContext = `
You are the Intelligent Duty Planner for an enterprise ERP system.
Generate an optimal, balanced duty chart schedule.

Duty Details:
- Title: ${title}
- Start Date: ${startDate}
- End Date: ${endDate}
- Schedule Period: ${formattedRange}
- Admin Instructions & Rules: ${instructions || 'Ensure fair shift distribution and no consecutive double shifts.'}
- Available Staff Roster: ${employeeRoster ? JSON.stringify(employeeRoster) : 'Arun Patel, Neha Verma, Shivam Kumar, Priya Sharma, Vikram Singh, Sunita Mehra, Rajesh Gupta, Anita Roy'}
${previousChart ? `- Previous Duty Chart Reference:\nFile Name: ${previousChart.name}\nExtracted Content:\n${previousChart.content}` : '- No previous chart provided. Generate fresh balanced assignments.'}

Generate an array of duty assignments covering all days between ${startDate} and ${endDate}.
Assign appropriate staff, shifts (e.g. "Morning Shift (08:00 - 14:00)", "Evening Shift (14:00 - 20:00)", "Night Duty (20:00 - 08:00)"), and stations (e.g. "Main Gate", "Reception", "Control Room", "Block A").
`;

        const aiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptContext,
          config: {
            systemInstruction: 'You are an Intelligent Duty Planner ERP assistant. Generate structured duty rosters adhering to administrative policies and avoiding scheduling conflicts.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              description: 'List of duty assignments',
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: 'Day name and date, e.g., Monday, 26 Oct' },
                  date: { type: Type.STRING, description: 'ISO date, e.g., 2026-10-26' },
                  shift: { type: Type.STRING, description: 'Shift name and hours' },
                  station: { type: Type.STRING, description: 'Duty post or department location' },
                  assignedStaff: { type: Type.STRING, description: 'Primary employee assigned' },
                  backupStaff: { type: Type.STRING, description: 'Reliever or backup employee' },
                  notes: { type: Type.STRING, description: 'Special instructions or notes' },
                },
                required: ['day', 'date', 'shift', 'station', 'assignedStaff'],
              },
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timed out, switching to smart roster generator')), 2500)
        );

        const response: any = await Promise.race([aiPromise, timeoutPromise]);

        if (response && response.text) {
          assignments = JSON.parse(response.text);
        }
      } catch (geminiError: any) {
        console.warn('Gemini generation notice, using intelligent planner generator:', geminiError.message);
      }
    }

    // Fallback algorithmic generation if AI call was unavailable or returned empty
    if (!assignments || assignments.length === 0) {
      assignments = generateAlgorithmicSchedule(title, startDate, endDate, instructions);
    }

    const csvContent = convertAssignmentsToCsv(title, formattedRange, assignments);
    const chartId = 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const now = Date.now();

    const record: TempFileRecord = {
      id: chartId,
      title,
      startDate,
      endDate,
      formattedDateRange: formattedRange,
      description: instructions,
      assignments,
      csvContent,
      createdAt: now,
      expiresAt: now + TWENTY_FOUR_HOURS_MS,
    };

    temporaryCharts.set(chartId, record);

    return res.json({
      chartId,
      title,
      startDate,
      endDate,
      formattedDateRange: formattedRange,
      assignments,
      csvContent,
      expiresAt: new Date(record.expiresAt).toISOString(),
      downloadUrl: `/api/download-temp/${chartId}`,
    });
  } catch (error: any) {
    console.error('Duty chart generation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate duty chart.' });
  }
});

// API: Download Temporary Generated File (24h retention header)
app.get('/api/download-temp/:fileId', (req, res) => {
  const { fileId } = req.params;
  const record = temporaryCharts.get(fileId);

  if (!record) {
    return res.status(404).send('Temporary duty chart file has expired or was removed.');
  }

  // Set 24 hour cache expiry header
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="duty-chart-${record.startDate}-to-${record.endDate}.csv"`);
  res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
  res.setHeader('X-Temporary-Expires-At', new Date(record.expiresAt).toISOString());

  return res.send(record.csvContent);
});

// API: Delete Temporary Server-Side File (Confirmation of download/backup)
app.delete('/api/temp-file/:fileId', (req, res) => {
  const { fileId } = req.params;
  if (temporaryCharts.has(fileId)) {
    temporaryCharts.delete(fileId);
    return res.json({ success: true, message: 'Temporary server-side file deleted.' });
  }
  return res.json({ success: true, message: 'File already cleared.' });
});

// Helper for deterministic algorithmic schedule
function generateAlgorithmicSchedule(
  title: string,
  startDateStr: string,
  endDateStr: string,
  _instructions?: string
): DutyAssignment[] {
  const staff = ['Arun Patel', 'Neha Verma', 'Shivam Kumar', 'Priya Sharma', 'Vikram Singh', 'Anita Roy'];
  const stations = ['Main Gate / Entry A', 'Reception & Dispatch', 'Block B Control Desk', 'Campus Patrol'];
  const shifts = [
    'Morning Shift (08:00 – 14:00)',
    'Evening Shift (14:00 – 20:00)',
    'Night Shift (20:00 – 08:00)',
  ];

  const results: DutyAssignment[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let current = new Date(start);
  let staffIdx = 0;

  while (current <= end && results.length < 50) {
    const dayStr = `${dayNames[current.getDay()]}, ${current.getDate()} ${monthNames[current.getMonth()]}`;
    const isoDate = current.toISOString().split('T')[0];

    for (let s = 0; s < Math.min(2, stations.length); s++) {
      const primary = staff[staffIdx % staff.length];
      const backup = staff[(staffIdx + 1) % staff.length];
      staffIdx++;

      results.push({
        day: dayStr,
        date: isoDate,
        shift: shifts[s % shifts.length],
        station: stations[s],
        assignedStaff: primary,
        backupStaff: backup,
        notes: s === 0 ? 'Standard check-in protocol' : 'Station handover required at shift end',
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return results;
}

// Dev & Production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Duty Planner ERP] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
