"""This module contains the test functions for the project."""
import yaml

with open("config/config.yaml", 'r') as f:
    config=yaml.safe_load(f)

print(config)
