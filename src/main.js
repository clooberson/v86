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
            memory_size: 32 * 1024 * 1024,  // 32MB default
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
        console.log("[v86] Emulator stopped");
    };

    /**
     * Register an event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    V86Starter.prototype.add_listener = function(event, callback)
    {
        if (!this._event_listeners[event])
        {
            this._event_listeners[event] = [];
        }
        this._event_listeners[event].push(callback);
    };

    /**
     * Emit an event to all registered listeners
     * @private
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    V86Starter.prototype._emit = function(event, data)
    {
        const listeners = this._event_listeners[event];
        if (listeners)
        {
            listeners.forEach(fn => fn(data));
        }
    };

    // Export for use in browser and Node.js environments
    if (typeof module !== "undefined" && module.exports)
    {
        module.exports = { V86Starter };
    }
    else if (typeof window !== "undefined")
    {
        window["V86Starter"] = V86Starter;
        window["V86"] = V86Starter; // alias
    }

})();
