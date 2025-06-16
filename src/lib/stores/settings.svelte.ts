// src/lib/stores/settings.svelte.ts
import { browser } from "$app/environment";
import { toast } from "svelte-sonner";

// Settings interfaces
export interface DockerConnectionSettings {
	host: string;
	connectionTimeout: number;
	autoReconnect: boolean;
	retryAttempts: number;
	retryDelay: number;
}

export interface ApplicationPreferences {
	theme: "light" | "dark" | "auto";
	autoRefreshInterval: number;
	containerRefreshInterval: number;
	imageRefreshInterval: number;
	volumeRefreshInterval: number;
	networkRefreshInterval: number;
	defaultContainerView: "all" | "running";
	language: string;
	enableNotifications: boolean;
	compactView: boolean;
}

export interface ResourceManagement {
	autoRemoveContainers: boolean;
	defaultImagePullPolicy: "always" | "missing" | "never";
	enableImageAutoCleanup: boolean;
	imageCleanupDays: number;
	enableVolumeAutoCleanup: boolean;
	volumeCleanupDays: number;
	maxContainerLogs: number;
	enableResourceWarnings: boolean;
	cpuWarningThreshold: number;
	memoryWarningThreshold: number;
	diskWarningThreshold: number;
}

export interface SecurityPrivacy {
	enableAuditLogging: boolean;
	auditLogRetentionDays: number;
	enableOperationConfirmation: boolean;
	allowDangerousOperations: boolean;
	enableTelemetry: boolean;
	dataRetentionDays: number;
	exportIncludeCredentials: boolean;
}

export interface AppSettings {
	docker: DockerConnectionSettings;
	application: ApplicationPreferences;
	resources: ResourceManagement;
	security: SecurityPrivacy;
	version: string;
	lastModified: number;
}

// Default settings
const defaultSettings: AppSettings = {
	docker: {
		host: "unix:///var/run/docker.sock",
		connectionTimeout: 30,
		autoReconnect: true,
		retryAttempts: 3,
		retryDelay: 2000,
	},
	application: {
		theme: "auto",
		autoRefreshInterval: 5000,
		containerRefreshInterval: 5000,
		imageRefreshInterval: 10000,
		volumeRefreshInterval: 15000,
		networkRefreshInterval: 15000,
		defaultContainerView: "all",
		language: "en",
		enableNotifications: true,
		compactView: false,
	},
	resources: {
		autoRemoveContainers: false,
		defaultImagePullPolicy: "missing",
		enableImageAutoCleanup: false,
		imageCleanupDays: 30,
		enableVolumeAutoCleanup: false,
		volumeCleanupDays: 30,
		maxContainerLogs: 1000,
		enableResourceWarnings: true,
		cpuWarningThreshold: 80,
		memoryWarningThreshold: 80,
		diskWarningThreshold: 80,
	},
	security: {
		enableAuditLogging: false,
		auditLogRetentionDays: 90,
		enableOperationConfirmation: true,
		allowDangerousOperations: false,
		enableTelemetry: true,
		dataRetentionDays: 365,
		exportIncludeCredentials: false,
	},
	version: "1.0.0",
	lastModified: Date.now(),
};

class SettingsStore {
	private _settings = $state<AppSettings>(structuredClone(defaultSettings));
	private _isLoading = $state<boolean>(false);
	private _isSaving = $state<boolean>(false);
	private _hasUnsavedChanges = $state<boolean>(false);
	private _error = $state<string | null>(null);
	private _lastSaved = $state<number | null>(null);

	// Storage key
	private readonly STORAGE_KEY = "docsee-settings";

	constructor() {
		// Load settings on initialization
		if (browser) {
			this.loadSettings();
		}
	}

	// Getters
	get settings() {
		return this._settings;
	}

	get isLoading() {
		return this._isLoading;
	}

	get isSaving() {
		return this._isSaving;
	}

	get hasUnsavedChanges() {
		return this._hasUnsavedChanges;
	}

	get error() {
		return this._error;
	}

	get lastSaved() {
		return this._lastSaved;
	}

	// Category getters
	get dockerSettings() {
		return this._settings.docker;
	}

	get applicationSettings() {
		return this._settings.application;
	}

	get resourceSettings() {
		return this._settings.resources;
	}

	get securitySettings() {
		return this._settings.security;
	}

	// Load settings from localStorage
	private loadSettings() {
		try {
			this._isLoading = true;
			this._error = null;

			const stored = localStorage.getItem(this.STORAGE_KEY);
			if (stored) {
				const parsedSettings = JSON.parse(stored) as AppSettings;

				// Merge with defaults to handle new settings
				this._settings = this.mergeWithDefaults(parsedSettings);
				this._lastSaved = this._settings.lastModified;
			}
		} catch (error) {
			console.error("Failed to load settings:", error);
			this._error = "Failed to load settings from storage";
			this._settings = structuredClone(defaultSettings);
		} finally {
			this._isLoading = false;
		}
	}

	// Merge stored settings with defaults
	private mergeWithDefaults(stored: Partial<AppSettings>): AppSettings {
		return {
			docker: { ...defaultSettings.docker, ...stored.docker },
			application: { ...defaultSettings.application, ...stored.application },
			resources: { ...defaultSettings.resources, ...stored.resources },
			security: { ...defaultSettings.security, ...stored.security },
			version: stored.version || defaultSettings.version,
			lastModified: stored.lastModified || Date.now(),
		};
	}

	// Save settings to localStorage
	async saveSettings(): Promise<boolean> {
		try {
			this._isSaving = true;
			this._error = null;

			// Update timestamp
			this._settings.lastModified = Date.now();

			// Save to localStorage
			localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._settings));

			this._hasUnsavedChanges = false;
			this._lastSaved = this._settings.lastModified;

			toast.success("Settings saved successfully");
			return true;
		} catch (error) {
			console.error("Failed to save settings:", error);
			this._error = "Failed to save settings";
			toast.error("Failed to save settings");
			return false;
		} finally {
			this._isSaving = false;
		}
	}

	// Reset to defaults
	resetToDefaults() {
		this._settings = structuredClone(defaultSettings);
		this._hasUnsavedChanges = true;
		this._error = null;
	}

	// Update individual settings categories
	updateDockerSettings(updates: Partial<DockerConnectionSettings>) {
		this._settings.docker = { ...this._settings.docker, ...updates };
		this._hasUnsavedChanges = true;
	}

	updateApplicationSettings(updates: Partial<ApplicationPreferences>) {
		this._settings.application = { ...this._settings.application, ...updates };
		this._hasUnsavedChanges = true;
	}

	updateResourceSettings(updates: Partial<ResourceManagement>) {
		this._settings.resources = { ...this._settings.resources, ...updates };
		this._hasUnsavedChanges = true;
	}

	updateSecuritySettings(updates: Partial<SecurityPrivacy>) {
		this._settings.security = { ...this._settings.security, ...updates };
		this._hasUnsavedChanges = true;
	}

	// Individual setting setters
	setTheme(theme: "light" | "dark" | "auto") {
		this.updateApplicationSettings({ theme });
	}

	setAutoRefreshInterval(interval: number) {
		this.updateApplicationSettings({ autoRefreshInterval: interval });
	}

	setDockerHost(host: string) {
		this.updateDockerSettings({ host });
	}

	setConnectionTimeout(timeout: number) {
		this.updateDockerSettings({ connectionTimeout: timeout });
	}

	// Export settings
	exportSettings(): string {
		const exportData = this._settings.security.exportIncludeCredentials
			? this._settings
			: {
					...this._settings,
					docker: {
						...this._settings.docker,
						// Remove sensitive data if not including credentials
					},
				};

		return JSON.stringify(exportData, null, 2);
	}

	// Import settings
	async importSettings(settingsJson: string): Promise<boolean> {
		try {
			const importedSettings = JSON.parse(settingsJson) as Partial<AppSettings>;

			// Validate basic structure
			if (typeof importedSettings !== "object" || importedSettings === null) {
				throw new Error("Invalid settings format");
			}

			// Merge with current settings
			this._settings = this.mergeWithDefaults(importedSettings);
			this._hasUnsavedChanges = true;
			this._error = null;

			toast.success("Settings imported successfully");
			return true;
		} catch (error) {
			console.error("Failed to import settings:", error);
			this._error = "Failed to import settings: Invalid format";
			toast.error("Failed to import settings: Invalid format");
			return false;
		}
	}

	// Validation methods
	validateDockerHost(host: string): string | null {
		if (!host.trim()) {
			return "Docker host cannot be empty";
		}

		// Basic validation for common Docker host formats
		const unixSocketPattern = /^unix:\/\/\/.+$/;
		const tcpPattern = /^tcp:\/\/.+:\d+$/;
		const httpPattern = /^https?:\/\/.+$/;

		if (
			!unixSocketPattern.test(host) &&
			!tcpPattern.test(host) &&
			!httpPattern.test(host)
		) {
			return "Invalid Docker host format. Use unix://, tcp://, http://, or https://";
		}

		return null;
	}

	validateTimeout(timeout: number): string | null {
		if (timeout < 1 || timeout > 300) {
			return "Timeout must be between 1 and 300 seconds";
		}
		return null;
	}

	validateRefreshInterval(interval: number): string | null {
		if (interval < 1000 || interval > 300000) {
			return "Refresh interval must be between 1 and 300 seconds";
		}
		return null;
	}

	validateThreshold(threshold: number): string | null {
		if (threshold < 1 || threshold > 100) {
			return "Threshold must be between 1 and 100 percent";
		}
		return null;
	}

	// Cleanup
	cleanup() {
		// Save any unsaved changes before cleanup
		if (this._hasUnsavedChanges) {
			this.saveSettings();
		}
	}

	// Clear error
	clearError() {
		this._error = null;
	}

	// Get settings summary for display
	getSettingsSummary() {
		return {
			dockerHost: this._settings.docker.host,
			theme: this._settings.application.theme,
			autoRefresh: this._settings.application.autoRefreshInterval,
			notifications: this._settings.application.enableNotifications,
			auditLogging: this._settings.security.enableAuditLogging,
			lastModified: new Date(this._settings.lastModified).toLocaleString(),
		};
	}
}

// Create and export singleton instance
export const settingsStore = new SettingsStore();
