# Building and Publishing the Trainly Python SDK

This guide explains how to build and publish the Trainly Python SDK to PyPI.

## Prerequisites

1. Python 3.8 or higher
2. `pip` and `setuptools` installed
3. PyPI account (for publishing)
4. `twine` for uploading to PyPI

Install build tools:
```bash
pip install build twine
```

## Building the Package

### 1. Clean Previous Builds

```bash
# Remove old build artifacts
rm -rf build/ dist/ *.egg-info
```

### 2. Build the Distribution

```bash
# Build both wheel and source distributions
python -m build
```

This creates:
- `dist/trainly-0.1.0-py3-none-any.whl` (wheel distribution)
- `dist/trainly-0.1.0.tar.gz` (source distribution)

### 3. Check the Build

```bash
# Check that the package is valid
twine check dist/*
```

## Testing Locally

Before publishing, test the package locally:

### Install in Development Mode

```bash
pip install -e .
```

### Run Tests

```bash
# Install test dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run with coverage
pytest --cov=trainly
```

### Test the Installation

```bash
# Create a test environment
python -m venv test_env
source test_env/bin/activate  # On Windows: test_env\Scripts\activate

# Install the built package
pip install dist/trainly-0.1.0-py3-none-any.whl

# Test import
python -c "from trainly import TrainlyClient; print('✅ Import successful')"

# Deactivate
deactivate
```

## Publishing to PyPI

### 1. Test on TestPyPI (Recommended)

First, publish to TestPyPI to make sure everything works:

```bash
# Upload to TestPyPI
twine upload --repository testpypi dist/*
```

You'll be prompted for your TestPyPI credentials.

Test the installation from TestPyPI:
```bash
pip install --index-url https://test.pypi.org/simple/ trainly
```

### 2. Publish to PyPI

Once you've verified everything works on TestPyPI:

```bash
# Upload to PyPI
twine upload dist/*
```

You'll be prompted for your PyPI credentials.

### 3. Verify Installation

```bash
# Install from PyPI
pip install trainly

# Test it works
python -c "from trainly import TrainlyClient; print('✅ Package published successfully')"
```

## Using API Tokens (Recommended)

Instead of entering credentials each time, use API tokens:

### 1. Create `.pypirc` file

Create `~/.pypirc`:

```ini
[pypi]
username = __token__
password = pypi-your-api-token-here

[testpypi]
username = __token__
password = pypi-your-test-api-token-here
```

### 2. Upload with Tokens

```bash
# Now you can upload without prompts
twine upload dist/*
```

## Version Updates

When releasing a new version:

### 1. Update Version Number

Update version in:
- `setup.py`
- `pyproject.toml`
- `trainly/__init__.py`

### 2. Update CHANGELOG

Document changes in a CHANGELOG.md file.

### 3. Create Git Tag

```bash
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin v0.1.0
```

### 4. Build and Publish

```bash
# Clean old builds
rm -rf build/ dist/ *.egg-info

# Build new version
python -m build

# Check
twine check dist/*

# Upload
twine upload dist/*
```

## Continuous Integration (Optional)

For automated publishing, set up GitHub Actions:

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install build twine

      - name: Build package
        run: python -m build

      - name: Publish to PyPI
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}
        run: twine upload dist/*
```

Add your PyPI token to GitHub Secrets as `PYPI_API_TOKEN`.

## Best Practices

1. **Always test locally first** - Install and test before publishing
2. **Use TestPyPI** - Test your package on TestPyPI before PyPI
3. **Version carefully** - Follow semantic versioning (MAJOR.MINOR.PATCH)
4. **Document changes** - Maintain a CHANGELOG
5. **Tag releases** - Use git tags for version tracking
6. **Keep credentials secure** - Use API tokens, never commit credentials

## Troubleshooting

### "File already exists" Error

PyPI doesn't allow re-uploading the same version. You need to:
1. Delete the dist/ folder
2. Increment the version number
3. Rebuild and upload

### Import Errors

Make sure your package structure is correct:
```
trainly/
├── __init__.py
├── client.py
├── models.py
└── v1_client.py
```

### Missing Dependencies

Ensure all dependencies are listed in:
- `requirements.txt`
- `setup.py` (install_requires)
- `pyproject.toml` (dependencies)

## Resources

- [Python Packaging Guide](https://packaging.python.org/)
- [PyPI Help](https://pypi.org/help/)
- [TestPyPI](https://test.pypi.org/)
- [Semantic Versioning](https://semver.org/)

## Quick Reference

```bash
# Complete build and publish workflow
rm -rf build/ dist/ *.egg-info     # Clean
python -m build                     # Build
twine check dist/*                  # Check
twine upload --repository testpypi dist/*  # Test
twine upload dist/*                 # Publish
```

---

**Ready to publish?** Follow the steps above and your package will be available on PyPI! 🚀

