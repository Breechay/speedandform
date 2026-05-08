PYTHON ?= python3

.PHONY: validate-forge-data validate-all-data

validate-forge-data:
	$(PYTHON) scripts/validate_forge_program_data.py

validate-all-data: validate-forge-data
	@echo "All data validators passed."
