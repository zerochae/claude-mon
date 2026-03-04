import { vi } from "vitest";

vi.mock("@tauri-apps/api/core", () => import("./@tauri-apps/api/core"));
vi.mock("@tauri-apps/api/window", () => import("./@tauri-apps/api/window"));
