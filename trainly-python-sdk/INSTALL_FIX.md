# Installation Fix Guide

## Issue
The error occurs because:
1. License format was deprecated in `pyproject.toml`
2. Virtual environment has corrupted pip
3. Conflicts between `setup.py` and `pyproject.toml`

## ✅ Fixed
- Updated `pyproject.toml` to use modern license format
- Removed `setuptools_scm` requirement
- Simplified `setup.py` to avoid conflicts
- Removed deprecated license classifier

## 🚀 Installation Methods

### Method 1: Fresh Installation (Recommended)

```bash
cd /Users/kavin_jey/Desktop/teachai/trainly-python-sdk

# Remove old virtual environment
rm -rf myenv

# Create fresh virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install the package in development mode
pip install -e .

# Test it
python -c "from trainly import TrainlyClient; print('✅ Installation successful!')"
```

### Method 2: Direct Installation (Alternative)

If Method 1 fails, try installing without development mode first:

```bash
cd /Users/kavin_jey/Desktop/teachai/trainly-python-sdk

# Create fresh venv
python3 -m venv venv
source venv/bin/activate

# Install directly
pip install .

# Test it
python -c "from trainly import TrainlyClient; print('✅ Installation successful!')"
```

### Method 3: Use System Python (Quick Test)

If you just want to test without a virtual environment:

```bash
cd /Users/kavin_jey/Desktop/teachai/trainly-python-sdk

# Install using system Python
pip3 install --user .

# Test it
python3 -c "from trainly import TrainlyClient; print('✅ Installation successful!')"
```

### Method 4: Build and Install Wheel

Most reliable method:

```bash
cd /Users/kavin_jey/Desktop/teachai/trainly-python-sdk

# Install build tools
pip3 install --user build

# Build the package
python3 -m build

# Create new venv
python3 -m venv venv
source venv/bin/activate

# Install from wheel
pip install dist/trainly-0.1.0-py3-none-any.whl

# Test it
python -c "from trainly import TrainlyClient; print('✅ Installation successful!')"
```

## 🧪 Test After Installation

Create a test file `test_trainly.py`:

```python
from trainly import TrainlyClient, TrainlyV1Client
from trainly.models import QueryResponse, ChunkScore

print("✅ All imports successful!")
print(f"TrainlyClient: {TrainlyClient}")
print(f"TrainlyV1Client: {TrainlyV1Client}")
print(f"QueryResponse: {QueryResponse}")
print(f"ChunkScore: {ChunkScore}")
```

Run it:
```bash
python test_trainly.py
```

## 🔍 Troubleshooting

### If you still get errors:

1. **Check Python version:**
   ```bash
   python3 --version  # Should be 3.8 or higher
   ```

2. **Clear all caches:**
   ```bash
   cd /Users/kavin_jey/Desktop/teachai/trainly-python-sdk
   rm -rf build dist *.egg-info __pycache__ trainly/__pycache__
   find . -type d -name __pycache__ -exec rm -rf {} +
   ```

3. **Reinstall setuptools:**
   ```bash
   pip install --upgrade setuptools wheel
   ```

4. **Check for file permissions:**
   ```bash
   ls -la /Users/kavin_jey/Desktop/teachai/trainly-python-sdk/
   ```

### Common Errors and Solutions

**Error: "No module named pip"**
- Solution: Use Method 4 (build wheel) or Method 3 (system Python)

**Error: "setuptools_scm"**
- Solution: Already fixed in updated `pyproject.toml`

**Error: "License classifiers deprecated"**
- Solution: Already fixed in updated `pyproject.toml`

**Error: "Permission denied"**
- Solution: Use `--user` flag or create venv in a different location

## ✅ Recommended Quick Fix

Run these commands in your terminal:

```bash
# Navigate to package directory
cd /Users/kavin_jey/Desktop/teachai/trainly-python-sdk

# Clean everything
rm -rf myenv venv build dist *.egg-info

# Create fresh environment
python3 -m venv fresh_venv

# Activate
source fresh_venv/bin/activate

# Upgrade tools
pip install --upgrade pip setuptools wheel

# Install package
pip install -e .

# Test
python -c "from trainly import TrainlyClient; print('Success!')"
```

If this works, you're all set! 🎉

