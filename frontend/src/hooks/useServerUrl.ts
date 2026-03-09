const STORAGE_KEY = "cutcam_server_url";
const DEFAULT_URL = "http://192.168.1.100:8000";

export function getServerUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setServerUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url);
}
