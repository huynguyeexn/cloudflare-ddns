import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Logger } from '../../src/utils/logger.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('Logger Rotation', () => {
    let tempDir: string;
    let logFile: string;

    beforeAll(async () => {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'logger-test-'));
        logFile = path.join(tempDir, 'test.log');
        Logger.setLogFile(logFile);
    });

    afterAll(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    beforeEach(async () => {
        // Clear log file before each test
        try {
            await fs.unlink(logFile);
        } catch {
            // ignore
        }
        // Cleanup backups
        const files = await fs.readdir(tempDir);
        for (const file of files) {
            if (file !== 'test.log') {
                await fs.unlink(path.join(tempDir, file));
            }
        }
    });

    it('should create log file if it does not exist', async () => {
        await Logger.info('Test message');
        const exists = await fs.exists(logFile);
        expect(exists).toBe(true);
        const content = await fs.readFile(logFile, 'utf-8');
        expect(content).toContain('Test message');
    });

    it('should rotate logs when size exceeded', async () => {
        // Set small limit: 50 bytes
        Logger.setMaxLogSize(50);

        // Write enough data to exceed
        const longMessage = 'A'.repeat(60);
        await Logger.info(longMessage);

        // Check size
        const stats = await fs.stat(logFile);
        expect(stats.size).toBeGreaterThan(50);

        // Sleep to ensure timestamp difference (windows/mac fs precision)
        await new Promise(r => setTimeout(r, 1000));

        // Write again to trigger rotation
        await Logger.info('Trigger rotation');

        // Check availability of rotated file
        const files = await fs.readdir(tempDir);
        const backupFiles = files.filter(f => f.startsWith('test.log.'));

        expect(backupFiles.length).toBe(1);
    });

    it('should limit number of backup files', async () => {
        Logger.setMaxLogSize(10);
        Logger.setMaxLogFiles(2);

        for (let i = 0; i < 4; i++) {
            await Logger.info(`Message ${i}`);
            await new Promise(r => setTimeout(r, 1100));
        }

        const files = await fs.readdir(tempDir);
        const backupFiles = files.filter(f => f.startsWith('test.log.'));

        expect(backupFiles.length).toBeLessThanOrEqual(2);
    });
});
