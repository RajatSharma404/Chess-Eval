import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const fen = req.nextUrl.searchParams.get('fen');
  const depth = req.nextUrl.searchParams.get('depth') || '15';
  const mode = req.nextUrl.searchParams.get('mode') || 'continuous';
  
  if (!fen) {
    return new Response('Missing fen', { status: 400 });
  }

  // Robust path resolution for Windows & server environments
  const candidatePaths = [
    path.join(process.cwd(), 'stockfish17', 'stockfish', 'stockfish-windows-x86-64-avx2.exe'),
    path.join(process.cwd(), 'frontend', 'stockfish17', 'stockfish', 'stockfish-windows-x86-64-avx2.exe'),
    path.join(process.cwd(), '..', 'frontend', 'stockfish17', 'stockfish', 'stockfish-windows-x86-64-avx2.exe'),
  ];

  const exePath = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];

  const stream = new ReadableStream({
    start(controller) {
      let isClosed = false;
      const safeClose = () => {
        if (!isClosed) {
          isClosed = true;
          try { controller.close(); } catch (e) {}
        }
      };

      let sf: any = null;
      try {
        sf = spawn(exePath);
      } catch (err) {
        console.error('Failed to spawn Stockfish:', err);
        controller.enqueue(`data: bestmove (none)\n\n`);
        safeClose();
        return;
      }

      const onData = (data: Buffer) => {
        if (isClosed) return;
        const text = data.toString();
        const lines = text.split('\n');
        for (let line of lines) {
          line = line.trim();
          if (line) {
            try {
              controller.enqueue(`data: ${line}\n\n`);
            } catch (e) {
              safeClose();
            }
          }
        }
      };

      sf.stdout.on('data', onData);
      
      sf.on('close', () => { safeClose(); });
      sf.on('error', (err: any) => {
        console.error('Stockfish spawn error:', err);
        safeClose();
      });

      const safeWrite = (str: string) => {
        if (!isClosed && sf.stdin.writable) {
          try { sf.stdin.write(str); } catch (e) {}
        }
      };

      safeWrite('uci\n');
      safeWrite('setoption name Threads value 4\n');
      safeWrite('setoption name Hash value 1024\n');
      safeWrite('setoption name MultiPV value 3\n');
      safeWrite(`position fen ${fen}\n`);
      
      if (mode === 'single') {
        safeWrite(`go depth ${depth}\n`);
        const endData = (data: Buffer) => {
          if (data.toString().includes('bestmove')) {
            safeWrite('quit\n');
          }
        };
        sf.stdout.on('data', endData);
      } else {
        safeWrite(`go infinite\n`);
      }
      
      req.signal.addEventListener('abort', () => {
        safeWrite('quit\n');
        safeClose();
        try { sf.kill(); } catch (e) {}
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
