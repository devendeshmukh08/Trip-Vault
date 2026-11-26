import { neon } from "@neondatabase/serverless";
export const sql = neon(process.env.DATABASE_URL!);
export type Trip = { id: string; name: string; destination: string; start_date: string | null; end_date: string | null; emoji: string };
export type Item = { id: string; trip_id: string; day: number; time: string; title: string; done: boolean };
export type FileRow = { id: string; trip_id: string; kind: "doc" | "photo"; category: string; name: string; size: number; url: string; caption: string };
