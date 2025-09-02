import click
import sys
import os
from pathlib import Path

# Ensure the 'src' directory is in the Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import the logic from the original scripts
# Note: We will need to refactor the original scripts to be importable functions
from simple_test_generator import main as simple_generator_main
from enhanced_test_generator import main as enhanced_generator_main
from generate_test_from_json import main as from_json_generator_main
from regenerate_all_tests import regenerate_all_tests
from run_tests import main as run_tests_main
from test_quality_analysis import main as quality_analysis_main

@click.group()
def cli():
    """AI API Test Automation CLI Tool"""
    pass

@cli.group()
def generate():
    """Commands for generating tests."""
    pass

@generate.command('simple')
@click.argument('json_file', type=click.Path(exists=True))
@click.option('--output-dir', default='tests/generated', help='Output directory for generated tests.')
def simple_generator(json_file, output_dir):
    """Generates simple tests from an API JSON file."""
    click.echo(f"Running simple test generator for {json_file}...")
    # To make this work, we need to adapt the original `main` function to accept arguments
    # instead of reading from sys.argv. This is a placeholder for the refactored call.
    # For now, we'll simulate by setting sys.argv, which is not ideal but works for a start.
    sys.argv = ['simple_test_generator.py', json_file, output_dir]
    simple_generator_main()

@generate.command('enhanced')
@click.argument('json_file', type=click.Path(exists=True))
@click.option('--output-dir', default='tests/generated', help='Output directory for generated tests.')
def enhanced_generator(json_file, output_dir):
    """Generates enhanced, high-quality tests from an API JSON file."""
    click.echo(f"Running enhanced test generator for {json_file}...")
    sys.argv = ['enhanced_test_generator.py', json_file, output_dir]
    enhanced_generator_main()

@generate.command('from-json')
@click.argument('json_file', type=click.Path(exists=True))
def from_json_generator(json_file):
    """
    Generate tests from a single API JSON file.
    Supports OpenAPI, ApiFox, or single API spec formats.
    """
    click.echo(f"Running test generator for {json_file}...")
    sys.argv = ['generate_test_from_json.py', json_file]
    # This function is async, so we need to run it in an event loop.
    import asyncio
    asyncio.run(from_json_generator_main())

@generate.command('regenerate-all')
def regenerate_all():
    """Regenerates all tests using the latest templates."""
    click.echo("Regenerating all test files...")
    regenerate_all_tests()

@cli.command('run')
@click.option('--type', default='all', type=click.Choice(['all', 'crud', 'auth', 'error', 'concurrency', 'boundary', 'validation']), help='Type of tests to run.')
@click.option('--path', default='tests/generated', help='Path to the test directory.')
@click.option('--coverage', is_flag=True, help='Run with a coverage report.')
def run(type, path, coverage):
    """Runs the generated API tests using pytest."""
    click.echo("Running tests...")
    # This is a temporary solution. Ideally, we refactor run_tests.py
    args = []
    if type != 'all':
        args.extend(['--type', type])
    if path != 'tests/generated':
        args.extend(['--path', path])
    if coverage:
        args.append('--coverage')
    
    sys.argv = ['run_tests.py'] + args
    run_tests_main()

@cli.command('analyze')
@click.option('--original-dir', default='tests/generated', help='Directory of original generator output.')
@click.option('--enhanced-dir', default='tests/enhanced', help='Directory of enhanced generator output.')
def analyze(original_dir, enhanced_dir):
    """Analyzes and compares the quality of generated tests."""
    click.echo("Analyzing test quality...")
    # We need to adapt the original script to take these dirs as arguments
    # For now, the script is hardcoded, so we'll just call the main function.
    quality_analysis_main()


if __name__ == '__main__':
    # This allows the script to be run directly for testing
    # e.g., python src/cli/main.py generate simple my_api.json
    cli()
