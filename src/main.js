"use strict";

/**
 * v86 - x86 PC emulator in JavaScript
 * Main entry point for the emulator
 */

(function()
{
    /**
     * @constructor
     * @param {Object} settings - Emulator configuration options
     */
    function V86Starter(settings)
    {
        // Default configuration
        this.settings = {
            memory_size: 256 * 1024 * 1024,  // bumped to 256MB, works better for debian/arch
            vga_memory_size: 8 * 1024 * 1024, // 8MB VGA memory
            boot_order: 0x213,
            network_relay_url: "",
            disable_mouse: false,
            disable_keyboard: false,
            acpi: false,
            ...settings
        };

        this._running = false;
        this._cpu = null;
        this._event_listeners = {};

        this._init();
    }

    /**
     * Initialize the emulator components
     * @private
     */
    V86Starter.prototype._init = function()
    {
        console.log("[v86] Initializing emulator...");

        if (!this.settings.wasm_path)
        {
            console.error("[v86] wasm_path is required in settings");
            return;
        }

        this._load_wasm(this.settings.wasm_path);
    };

    /**
     * Load the WebAssembly module
     * @private
     * @param {string} path - Path to the .wasm file
     */
    V86Starter.prototype._load_wasm = function(path)
    {
        const self = this;

        fetch(path)
            .then(response => response.arrayBuffer())
            .then(bytes => WebAssembly.instantiate(bytes, self._get_wasm_imports()))
            .then(result =>
            {
                self._wasm_instance = result.instance;
                console.log("[v86] WASM module loaded successfully");
                self._emit("wasm-ready", {});
            })
            .catch(err =>
            {
                console.error("[v86] Failed to load WASM module:", err);
                self._emit("error", { message: err.toString() });
            });
    };

    /**
     * Get WebAssembly import object
     * @private
     * @returns {Object}
     */
    V86Starter.prototype._get_wasm_imports = function()
    {
        const self = this;
        return {
            env: {
                memory: new WebAssembly.Memory({ initial: 256 }),
                abort: function(msg, file, line, col)
                {
                    console.error("[v86] WASM abort:", msg, file, line, col);
                },
            }
        };
    };

    /**
     * Start the emulator
     */
    V86Starter.prototype.run = function()
    {
        if (this._running)
        {
            console.warn("[v86] Emulator is already running");
            return;
        }
        this._running = true;
        this._emit("started", {});
        console.log("[v86] Emulator started");
    };

    /**
     * Stop the emulator
     */
    V86Starter.prototype.stop = function()
    {
        this._running = false;
        this._emit("stopped", {});
        console.log("[v86] Emu
