"""
Master Analysis Pipeline for AI Diagnostic Trials Network Analysis
Runs all analysis scripts in sequence

Usage:
    python analysis/run_all_analysis.py
"""

import os
import subprocess
import sys


def run_script(script_path):
    """Run a Python script and handle errors"""
    print(f"\n{'=' * 70}")
    print(f"Running: {script_path}")
    print(f"{'=' * 70}\n")

    try:
        result = subprocess.run(
            [sys.executable, script_path], check=True, capture_output=False
        )
        print(f"\n✓ {script_path} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n✗ {script_path} failed with error code {e.returncode}")
        return False
    except Exception as e:
        print(f"\n✗ Error running {script_path}: {str(e)}")
        return False


def main():
    """Run all analysis scripts in order"""
    scripts = [
        "analysis/01_calculate_centrality.py",
        "analysis/02_visualize_geographic_temporal.py",
    ]

    print("=" * 70)
    print("AI DIAGNOSTIC TRIALS NETWORK ANALYSIS - MASTER PIPELINE")
    print("=" * 70)
    print(f"\nWill run {len(scripts)} script(s):")
    for i, script in enumerate(scripts, 1):
        print(f"  {i}. {script}")

    print("\nStarting analysis pipeline...\n")

    success_count = 0
    for script in scripts:
        if run_script(script):
            success_count += 1
        else:
            print(f"\n⚠ Pipeline stopped due to error in {script}")
            sys.exit(1)

    print("\n" + "=" * 70)
    print("PIPELINE COMPLETE!")
    print("=" * 70)
    print(f"\n✓ Successfully completed {success_count}/{len(scripts)} script(s)")
    print("\nResults are available in:")
    print("  - results/ (tables and figures)")
    print("  - results/figures/ (main figures)")
    print("  - results/figures/supplementary/ (supplementary figures)")
    print("  - results/tables/ (main tables)")
    print("  - results/tables/supplementary/ (supplementary tables)")


if __name__ == "__main__":
    main()
