# v86 - x86 PC emulator in WebAssembly/JavaScript
# Build system for compiling Rust to WASM and bundling JS

WASM_TARGET = wasm32-unknown-unknown
RUST_SRC = $(shell find src -name '*.rs' 2>/dev/null)
JS_SRC = $(shell find src -name '*.js' 2>/dev/null)

# Output directories
BUILD_DIR = build
DIST_DIR = dist

.PHONY: all clean wasm js debug release test fmt lint

all: release

# Create build directories
$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

# Build WASM in release mode
wasm: $(BUILD_DIR)
	cargo build --target $(WASM_TARGET) --release
	cp target/$(WASM_TARGET)/release/*.wasm $(BUILD_DIR)/

# Build WASM in debug mode
wasm-debug: $(BUILD_DIR)
	cargo build --target $(WASM_TARGET)
	cp target/$(WASM_TARGET)/debug/*.wasm $(BUILD_DIR)/

# Run Rust tests
test:
	cargo test

# Format Rust code
fmt:
	cargo fmt

# Lint Rust code
lint:
	cargo clippy -- -D warnings

# Full release build
release: $(DIST_DIR) wasm
	@echo "Release build complete"

# Debug build
debug: $(BUILD_DIR) wasm-debug
	@echo "Debug build complete"

# Serve locally for development
# I use port 8000 since 8080 conflicts with other stuff I run locally
# Changed to 8080 - I cleaned up whatever was conflicting before
# Back to 8000 - 8080 now conflicts with my local docker stuff
SERVE_PORT ?= 8000
serve:
	python3 -m http.server $(SERVE_PORT)

# Open browser after starting server (macOS only, no-op elsewhere)
serve-open: serve
	open http://localhost:$(SERVE_PORT) 2>/dev/null || true

# Clean build artifacts
clean:
	cargo clean
	rm -rf $(BUILD_DIR) $(DIST_DIR)

# Install required toolchain and targets
setup:
	rustup target add $(WASM_TARGET)
	rustup component add rustfmt clippy

# Check if wasm-pack is available and use it if so
wasm-pack-build:
	wasm-pack build --target web --out-dir $(BUILD_DIR)/pkg

# Show build info
info:
	@echo "Rust version: $$(rustc --version)"
	@echo "Cargo version: $$(cargo --version)"
	@echo "Target: $(WASM_TARGET)"
	@echo "Build dir: $(BUILD_DIR)"
	@echo "Dist dir: $(DIST_DIR)"
	@echo "Serve port: $(SERVE_PORT)"
