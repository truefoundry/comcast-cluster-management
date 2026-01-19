import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface StorageRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export class JsonStorage<T extends StorageRecord> {
  private filePath: string;
  private data: T[] = [];

  constructor(fileName: string) {
    // Use /app/data for production (mounted volume), ./data for local dev
    const dataDir = process.env.DATA_DIR || './data';

    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.filePath = path.join(dataDir, fileName);
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(content) as T[];
        console.log(`Loaded ${this.data.length} records from ${this.filePath}`);
      } else {
        this.data = [];
        this.save(); // Create empty file
        console.log(`Created new storage file: ${this.filePath}`);
      }
    } catch (error) {
      console.error(`Error loading storage file: ${error}`);
      this.data = [];
    }
  }

  private save(): void {
    try {
      // Pretty print for readability (like a spreadsheet!)
      fs.writeFileSync(
        this.filePath,
        JSON.stringify(this.data, null, 2),
        'utf-8',
      );
    } catch (error) {
      console.error(`Error saving storage file: ${error}`);
      throw error;
    }
  }

  create(record: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
    const now = new Date().toISOString();
    const newRecord = {
      ...record,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    } as T;

    this.data.push(newRecord);
    this.save();
    return newRecord;
  }

  findAll(): T[] {
    return [...this.data].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  findOne(id: string): T | undefined {
    return this.data.find((record) => record.id === id);
  }

  findBy(predicate: (record: T) => boolean): T[] {
    return this.data
      .filter(predicate)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  update(
    id: string,
    updates: Partial<Omit<T, 'id' | 'createdAt'>>,
  ): T | undefined {
    const index = this.data.findIndex((record) => record.id === id);
    if (index === -1) return undefined;

    this.data[index] = {
      ...this.data[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.save();
    return this.data[index];
  }

  delete(id: string): boolean {
    const index = this.data.findIndex((record) => record.id === id);
    if (index === -1) return false;

    this.data.splice(index, 1);
    this.save();
    return true;
  }

  // Export to CSV (spreadsheet format!)
  exportToCsv(): string {
    if (this.data.length === 0) return '';

    const headers = Object.keys(this.data[0]);
    const rows = this.data.map((record) =>
      headers.map((h) => JSON.stringify(record[h] ?? '')).join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
