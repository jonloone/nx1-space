#!/usr/bin/env python3
"""
Kepler.gl Data Validation Script
Comprehensive validation for ground station data compatibility with Kepler.gl
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any, Tuple
import math

class KeplerDataValidator:
    def __init__(self, data_file: str = "kepler_ground_stations.json"):
        self.data_file = Path(data_file)
        self.errors = []
        self.warnings = []
        self.data = None
        
    def load_data(self) -> bool:
        """Load and parse JSON data file"""
        try:
            with open(self.data_file, 'r') as f:
                self.data = json.load(f)
            return True
        except FileNotFoundError:
            self.errors.append(f"Data file not found: {self.data_file}")
            return False
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON format: {e}")
            return False
    
    def validate_structure(self) -> bool:
        """Validate overall data structure for Kepler.gl compatibility"""
        if not self.data:
            self.errors.append("No data loaded")
            return False
            
        # Check top-level structure
        required_keys = ['version', 'data', 'config']
        for key in required_keys:
            if key not in self.data:
                self.errors.append(f"Missing top-level key: {key}")
                
        # Check data section
        if 'data' in self.data:
            data_section = self.data['data']
            required_data_keys = ['id', 'label', 'allData', 'fields']
            for key in required_data_keys:
                if key not in data_section:
                    self.errors.append(f"Missing data section key: {key}")
                    
            # Validate allData is a list
            if 'allData' in data_section and not isinstance(data_section['allData'], list):
                self.errors.append("allData must be a list")
                
        return len(self.errors) == 0
    
    def validate_geographical_data(self) -> bool:
        """Validate geographical coordinates"""
        if not self.data or 'data' not in self.data or 'allData' not in self.data['data']:
            return False
            
        stations = self.data['data']['allData']
        
        for i, station in enumerate(stations):
            # Check required geographical fields
            if 'latitude' not in station:
                self.errors.append(f"Station {i}: Missing latitude")
            elif not isinstance(station['latitude'], (int, float)):
                self.errors.append(f"Station {i}: Latitude must be numeric")
            elif not (-90 <= station['latitude'] <= 90):
                self.errors.append(f"Station {i}: Invalid latitude {station['latitude']}")
                
            if 'longitude' not in station:
                self.errors.append(f"Station {i}: Missing longitude")
            elif not isinstance(station['longitude'], (int, float)):
                self.errors.append(f"Station {i}: Longitude must be numeric")
            elif not (-180 <= station['longitude'] <= 180):
                self.errors.append(f"Station {i}: Invalid longitude {station['longitude']}")
                
        return len([e for e in self.errors if 'latitude' in e or 'longitude' in e]) == 0
    
    def validate_visualization_data(self) -> bool:
        """Validate data fields needed for visualization"""
        if not self.data or 'data' not in self.data or 'allData' not in self.data['data']:
            return False
            
        stations = self.data['data']['allData']
        
        # Required fields for basic visualization
        required_fields = ['name', 'overall_investment_score', 'investment_recommendation']
        
        for i, station in enumerate(stations):
            for field in required_fields:
                if field not in station:
                    self.errors.append(f"Station {i}: Missing required field {field}")
                    
            # Validate investment score
            if 'overall_investment_score' in station:
                score = station['overall_investment_score']
                if not isinstance(score, (int, float)):
                    self.errors.append(f"Station {i}: Investment score must be numeric")
                elif not (0 <= score <= 100):
                    self.warnings.append(f"Station {i}: Investment score {score} outside expected range 0-100")
                    
            # Validate investment recommendation
            if 'investment_recommendation' in station:
                rec = station['investment_recommendation']
                valid_recs = ['excellent', 'good', 'moderate', 'poor']
                if rec not in valid_recs:
                    self.warnings.append(f"Station {i}: Unexpected recommendation '{rec}', expected one of {valid_recs}")
                    
        return len([e for e in self.errors if 'required field' in e or 'Investment score' in e]) == 0
    
    def validate_color_coding(self) -> bool:
        """Validate color coding for visualization"""
        if not self.data or 'data' not in self.data or 'allData' not in self.data['data']:
            return False
            
        stations = self.data['data']['allData']
        
        for i, station in enumerate(stations):
            if 'color' in station:
                color = station['color']
                if not isinstance(color, list) or len(color) != 3:
                    self.errors.append(f"Station {i}: Color must be RGB array [R, G, B]")
                else:
                    for j, component in enumerate(color):
                        if not isinstance(component, (int, float)) or not (0 <= component <= 255):
                            self.errors.append(f"Station {i}: Color component {j} must be 0-255")
            else:
                self.warnings.append(f"Station {i}: Missing color coding")
                
        return len([e for e in self.errors if 'Color' in e]) == 0
    
    def validate_kepler_config(self) -> bool:
        """Validate Kepler.gl configuration section"""
        if not self.data or 'config' not in self.data:
            self.errors.append("Missing config section")
            return False
            
        config = self.data['config']
        
        # Check config structure
        if 'version' not in config:
            self.errors.append("Config missing version")
            
        if 'config' not in config:
            self.errors.append("Config missing nested config section")
            return False
            
        nested_config = config['config']
        
        # Check for essential configuration sections
        required_sections = ['visState', 'mapState']
        for section in required_sections:
            if section not in nested_config:
                self.errors.append(f"Config missing {section} section")
                
        # Validate mapState
        if 'mapState' in nested_config:
            map_state = nested_config['mapState']
            required_map_fields = ['latitude', 'longitude', 'zoom']
            for field in required_map_fields:
                if field not in map_state:
                    self.warnings.append(f"MapState missing {field}")
                    
        return len([e for e in self.errors if 'Config' in e]) == 0
    
    def validate_fields_definition(self) -> bool:
        """Validate field definitions for Kepler.gl"""
        if not self.data or 'data' not in self.data or 'fields' not in self.data['data']:
            self.errors.append("Missing fields definition")
            return False
            
        fields = self.data['data']['fields']
        
        if not isinstance(fields, list):
            self.errors.append("Fields must be an array")
            return False
            
        # Check each field definition
        for i, field in enumerate(fields):
            if not isinstance(field, dict):
                self.errors.append(f"Field {i}: Must be an object")
                continue
                
            required_field_props = ['name', 'type']
            for prop in required_field_props:
                if prop not in field:
                    self.errors.append(f"Field {i}: Missing {prop}")
                    
            # Validate field types
            if 'type' in field:
                valid_types = ['string', 'real', 'integer', 'boolean', 'timestamp']
                if field['type'] not in valid_types:
                    self.warnings.append(f"Field {i}: Unexpected type '{field['type']}'")
                    
        return len([e for e in self.errors if 'Field' in e]) == 0
    
    def validate_data_consistency(self) -> bool:
        """Check data consistency between stations and field definitions"""
        if not self.data or 'data' not in self.data:
            return False
            
        data_section = self.data['data']
        if 'allData' not in data_section or 'fields' not in data_section:
            return False
            
        stations = data_section['allData']
        fields = data_section['fields']
        
        if not stations:
            self.warnings.append("No station data found")
            return True
            
        # Get field names from definition
        defined_fields = {f['name'] for f in fields if isinstance(f, dict) and 'name' in f}
        
        # Get actual fields from first station
        actual_fields = set(stations[0].keys()) if stations else set()
        
        # Check for missing field definitions
        undefined_fields = actual_fields - defined_fields
        if undefined_fields:
            self.warnings.append(f"Fields in data but not defined: {undefined_fields}")
            
        # Check for defined but unused fields
        unused_fields = defined_fields - actual_fields
        if unused_fields:
            self.warnings.append(f"Fields defined but not in data: {unused_fields}")
            
        return True
    
    def run_full_validation(self) -> Dict[str, Any]:
        """Run all validation checks and return comprehensive report"""
        print("🔍 Starting Kepler.gl Data Validation...")
        
        # Load data
        if not self.load_data():
            return self._generate_report(False)
            
        print(f"✅ Loaded data from {self.data_file}")
        
        # Run validation checks
        checks = [
            ("Structure", self.validate_structure),
            ("Geographical Data", self.validate_geographical_data),
            ("Visualization Data", self.validate_visualization_data),
            ("Color Coding", self.validate_color_coding),
            ("Kepler Config", self.validate_kepler_config),
            ("Field Definitions", self.validate_fields_definition),
            ("Data Consistency", self.validate_data_consistency)
        ]
        
        results = {}
        for check_name, check_func in checks:
            print(f"🔍 Validating {check_name}...")
            results[check_name] = check_func()
            
        return self._generate_report(all(results.values()))
    
    def _generate_report(self, is_valid: bool) -> Dict[str, Any]:
        """Generate validation report"""
        report = {
            'is_valid': is_valid,
            'errors': self.errors,
            'warnings': self.warnings,
            'data_file': str(self.data_file),
            'summary': {}
        }
        
        if self.data and 'data' in self.data and 'allData' in self.data['data']:
            stations = self.data['data']['allData']
            report['summary'] = {
                'total_stations': len(stations),
                'countries': len(set(s.get('country', 'Unknown') for s in stations)),
                'operators': len(set(s.get('operator', 'Unknown') for s in stations)),
                'score_range': self._get_score_range(stations),
                'recommendation_distribution': self._get_recommendation_distribution(stations)
            }
            
        return report
    
    def _get_score_range(self, stations: List[Dict]) -> Tuple[float, float]:
        """Get investment score range"""
        scores = [s.get('overall_investment_score', 0) for s in stations]
        return (min(scores), max(scores)) if scores else (0, 0)
    
    def _get_recommendation_distribution(self, stations: List[Dict]) -> Dict[str, int]:
        """Get distribution of investment recommendations"""
        recommendations = [s.get('investment_recommendation', 'unknown') for s in stations]
        distribution = {}
        for rec in recommendations:
            distribution[rec] = distribution.get(rec, 0) + 1
        return distribution
    
    def print_report(self, report: Dict[str, Any]):
        """Print formatted validation report"""
        print("\n" + "="*60)
        print("📊 KEPLER.GL DATA VALIDATION REPORT")
        print("="*60)
        
        if report['is_valid']:
            print("✅ VALIDATION PASSED - Data is compatible with Kepler.gl")
        else:
            print("❌ VALIDATION FAILED - Issues found")
            
        print(f"\n📁 Data File: {report['data_file']}")
        
        if report['summary']:
            s = report['summary']
            print(f"\n📈 Data Summary:")
            print(f"   • Total Stations: {s['total_stations']}")
            print(f"   • Countries: {s['countries']}")
            print(f"   • Operators: {s['operators']}")
            print(f"   • Score Range: {s['score_range'][0]:.1f} - {s['score_range'][1]:.1f}")
            print(f"   • Recommendations: {s['recommendation_distribution']}")
        
        if report['errors']:
            print(f"\n❌ Errors ({len(report['errors'])}):")
            for error in report['errors']:
                print(f"   • {error}")
                
        if report['warnings']:
            print(f"\n⚠️  Warnings ({len(report['warnings'])}):")
            for warning in report['warnings']:
                print(f"   • {warning}")
                
        if report['is_valid']:
            print(f"\n🎯 Next Steps:")
            print(f"   1. Test with kepler-fixed.html")
            print(f"   2. Open http://localhost:8000/kepler-fixed.html")
            print(f"   3. Verify visualization renders correctly")
        else:
            print(f"\n🔧 Required Actions:")
            print(f"   1. Fix all errors listed above")
            print(f"   2. Address warnings if possible")
            print(f"   3. Re-run validation")
            
        print("\n" + "="*60)

def main():
    """Main validation function"""
    data_file = sys.argv[1] if len(sys.argv) > 1 else "kepler_ground_stations.json"
    
    validator = KeplerDataValidator(data_file)
    report = validator.run_full_validation()
    validator.print_report(report)
    
    # Return appropriate exit code
    sys.exit(0 if report['is_valid'] else 1)

if __name__ == "__main__":
    main()