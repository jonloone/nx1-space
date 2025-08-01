#!/usr/bin/env python3
"""
Pre-Kineviz Checklist
Comprehensive validation before sending to Kineviz team
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from typing import Dict, Tuple, List
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

class PreKinevizChecklist:
    """Run all checks before sending to Kineviz"""
    
    def __init__(self):
        self.checks = []
        self.passed = 0
        self.failed = 0
        
    def add_check(self, name: str, passed: bool, details: str = ""):
        """Add a check result"""
        self.checks.append({
            "name": name,
            "passed": passed,
            "details": details
        })
        if passed:
            self.passed += 1
        else:
            self.failed += 1
    
    def check_file_exists(self, filepath: str, description: str) -> bool:
        """Check if a required file exists"""
        exists = os.path.exists(filepath)
        self.add_check(
            f"{description} exists",
            exists,
            filepath if exists else f"Missing: {filepath}"
        )
        return exists
    
    def check_pipeline_outputs(self) -> bool:
        """Check all pipeline outputs exist"""
        print(f"\n{Fore.CYAN}📁 Checking Pipeline Outputs...{Style.RESET_ALL}")
        
        required_files = {
            "data/graphxr_export.json": "GraphXR export",
            "data/analytics_summary.json": "Analytics summary",
            "data/graphxr_export_sample.json": "Sample export"
        }
        
        all_exist = True
        for filepath, description in required_files.items():
            if not self.check_file_exists(filepath, description):
                all_exist = False
        
        return all_exist
    
    def check_data_size(self) -> bool:
        """Check export file sizes are reasonable"""
        print(f"\n{Fore.CYAN}📏 Checking Data Sizes...{Style.RESET_ALL}")
        
        export_path = "data/graphxr_export.json"
        if not os.path.exists(export_path):
            self.add_check("Export size check", False, "Export file not found")
            return False
        
        # Check file size
        size_mb = os.path.getsize(export_path) / (1024 * 1024)
        
        # GraphXR has limits on file size
        if size_mb > 100:
            self.add_check(
                "Export size reasonable",
                False,
                f"File too large: {size_mb:.1f}MB (max 100MB)"
            )
            return False
        else:
            self.add_check(
                "Export size reasonable",
                True,
                f"Size: {size_mb:.1f}MB"
            )
        
        # Check node/edge counts
        try:
            with open(export_path, 'r') as f:
                data = json.load(f)
            
            node_count = len(data.get('nodes', []))
            edge_count = len(data.get('edges', []))
            
            # Reasonable limits for GraphXR
            if node_count > 50000:
                self.add_check(
                    "Node count reasonable",
                    False,
                    f"Too many nodes: {node_count:,} (max 50,000)"
                )
            else:
                self.add_check(
                    "Node count reasonable",
                    True,
                    f"Nodes: {node_count:,}"
                )
            
            if edge_count > 100000:
                self.add_check(
                    "Edge count reasonable",
                    False,
                    f"Too many edges: {edge_count:,} (max 100,000)"
                )
            else:
                self.add_check(
                    "Edge count reasonable",
                    True,
                    f"Edges: {edge_count:,}"
                )
            
            return True
            
        except Exception as e:
            self.add_check("Data size check", False, str(e))
            return False
    
    def run_validation_suite(self) -> bool:
        """Run the validation suite"""
        print(f"\n{Fore.CYAN}🔍 Running Validation Suite...{Style.RESET_ALL}")
        
        try:
            result = subprocess.run(
                [sys.executable, "test_viz/validation_suite.py"],
                capture_output=True,
                text=True
            )
            
            # Check if validation passed
            passed = result.returncode == 0
            
            self.add_check(
                "Validation suite passed",
                passed,
                "All validations passed" if passed else "Validation errors found"
            )
            
            return passed
            
        except Exception as e:
            self.add_check("Validation suite", False, str(e))
            return False
    
    def check_documentation(self) -> bool:
        """Check documentation is complete"""
        print(f"\n{Fore.CYAN}📚 Checking Documentation...{Style.RESET_ALL}")
        
        docs = {
            "README_POC.md": "POC documentation",
            "POC_DELIVERY_SUMMARY.md": "Delivery summary"
        }
        
        all_exist = True
        for filepath, description in docs.items():
            if not self.check_file_exists(filepath, description):
                all_exist = False
        
        return all_exist
    
    def check_sample_queries(self) -> bool:
        """Test that sample queries work"""
        print(f"\n{Fore.CYAN}🔎 Testing Sample Queries...{Style.RESET_ALL}")
        
        # Check if we have sample data to test
        if not os.path.exists("data/graphxr_export_sample.json"):
            self.add_check("Sample queries", False, "No sample data to test")
            return False
        
        try:
            with open("data/graphxr_export_sample.json", 'r') as f:
                sample_data = json.load(f)
            
            # Test basic traversal
            nodes_by_id = {n['id']: n for n in sample_data['nodes']}
            
            # Find a ground station with connections
            test_passed = False
            for edge in sample_data['edges']:
                if edge['label'] == 'SERVES':
                    source_node = nodes_by_id.get(edge['source'])
                    target_node = nodes_by_id.get(edge['target'])
                    
                    if source_node and target_node:
                        test_passed = True
                        break
            
            self.add_check(
                "Sample query traversal",
                test_passed,
                "Can traverse SERVES relationships" if test_passed else "Cannot traverse graph"
            )
            
            return test_passed
            
        except Exception as e:
            self.add_check("Sample queries", False, str(e))
            return False
    
    def check_dependencies(self) -> bool:
        """Check all dependencies are documented"""
        print(f"\n{Fore.CYAN}📦 Checking Dependencies...{Style.RESET_ALL}")
        
        if not self.check_file_exists("requirements.txt", "Requirements file"):
            return False
        
        # Check if requirements can be parsed
        try:
            with open("requirements.txt", 'r') as f:
                lines = f.readlines()
            
            packages = [line.strip() for line in lines if line.strip() and not line.startswith('#')]
            
            self.add_check(
                "Dependencies documented",
                len(packages) > 0,
                f"Found {len(packages)} packages"
            )
            
            return True
            
        except Exception as e:
            self.add_check("Dependencies check", False, str(e))
            return False
    
    def generate_handoff_package(self):
        """Generate final handoff package info"""
        print(f"\n{Fore.CYAN}📦 Generating Handoff Package...{Style.RESET_ALL}")
        
        handoff_info = {
            "generated_at": datetime.now().isoformat(),
            "checklist_results": {
                "total_checks": len(self.checks),
                "passed": self.passed,
                "failed": self.failed
            },
            "files_to_send": [
                "data/graphxr_export.json",
                "data/graphxr_export_sample.json",
                "data/analytics_summary.json",
                "POC_DELIVERY_SUMMARY.md",
                "README_POC.md"
            ],
            "demo_queries": [
                {
                    "name": "Find Investment Opportunities",
                    "description": "Underutilized stations in high-demand areas",
                    "sample": "Stations with <40% utilization serving regions with >70% connectivity gap"
                },
                {
                    "name": "Critical Network Bridges",
                    "description": "High-value infrastructure connections",
                    "sample": "Bridge connections worth >$5M annually"
                },
                {
                    "name": "Weather Vulnerability Analysis",
                    "description": "Stations affected by severe weather",
                    "sample": "Stations with >100 hours annual weather downtime"
                }
            ],
            "contact_ready": self.failed == 0
        }
        
        # Save handoff info
        with open("test_viz/handoff_package.json", 'w') as f:
            json.dump(handoff_info, f, indent=2)
        
        print(f"{Fore.GREEN}✓ Handoff package info saved{Style.RESET_ALL}")
    
    def print_summary(self):
        """Print final summary with visual report"""
        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}📋 PRE-KINEVIZ CHECKLIST SUMMARY{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        
        # Show all checks
        for check in self.checks:
            icon = "✅" if check['passed'] else "❌"
            color = Fore.GREEN if check['passed'] else Fore.RED
            print(f"{icon} {color}{check['name']}{Style.RESET_ALL}")
            if check['details']:
                print(f"   {check['details']}")
        
        # Summary stats
        print(f"\n{Fore.CYAN}📊 Results:{Style.RESET_ALL}")
        print(f"   Total checks: {len(self.checks)}")
        print(f"   {Fore.GREEN}Passed: {self.passed}{Style.RESET_ALL}")
        print(f"   {Fore.RED}Failed: {self.failed}{Style.RESET_ALL}")
        
        # Final verdict
        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        if self.failed == 0:
            print(f"{Fore.GREEN}🎉 READY FOR KINEVIZ!{Style.RESET_ALL}")
            print(f"\n{Fore.CYAN}📤 Files to send:{Style.RESET_ALL}")
            print("   1. data/graphxr_export.json")
            print("   2. data/graphxr_export_sample.json")
            print("   3. data/analytics_summary.json")
            print("   4. POC_DELIVERY_SUMMARY.md")
            print(f"\n{Fore.CYAN}💡 Next steps:{Style.RESET_ALL}")
            print("   1. Review the interactive visualization:")
            print(f"      {Fore.YELLOW}streamlit run test_viz/streamlit_graph_viewer.py{Style.RESET_ALL}")
            print("   2. Send files to Kineviz team")
            print("   3. Schedule demo to walk through queries")
        else:
            print(f"{Fore.RED}❌ NOT READY - FIX ISSUES FIRST{Style.RESET_ALL}")
            print(f"\n{Fore.YELLOW}Please address the failed checks above.{Style.RESET_ALL}")
            print(f"Run {Fore.YELLOW}python pipelines/run_pipeline.py{Style.RESET_ALL} if needed.")
    
    def run_all_checks(self) -> bool:
        """Run all pre-Kineviz checks"""
        print(f"{Fore.CYAN}🚀 Running Pre-Kineviz Checklist...{Style.RESET_ALL}")
        print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run all checks
        self.check_pipeline_outputs()
        self.check_data_size()
        self.run_validation_suite()
        self.check_documentation()
        self.check_sample_queries()
        self.check_dependencies()
        
        # Generate handoff package
        self.generate_handoff_package()
        
        # Print summary
        self.print_summary()
        
        return self.failed == 0


def main():
    """Main entry point"""
    checklist = PreKinevizChecklist()
    success = checklist.run_all_checks()
    
    # Return appropriate exit code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()