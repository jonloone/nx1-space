#!/usr/bin/env python3
"""
Test Script for Kepler.gl Ground Station Visualization
Tests the HTML solution and data compatibility
"""

import json
import time
import subprocess
import requests
import signal
import os
from pathlib import Path
from typing import Dict, Any

class KeplerSolutionTester:
    def __init__(self):
        self.server_pid = None
        self.port = 8080
        self.base_url = f"http://localhost:{self.port}"
        
    def start_server(self) -> bool:
        """Start local HTTP server for testing"""
        try:
            # Start server in background
            self.server_process = subprocess.Popen(
                ['python3', '-m', 'http.server', str(self.port)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
            # Wait for server to start
            time.sleep(2)
            
            # Test if server is responding
            response = requests.get(f"{self.base_url}/", timeout=5)
            if response.status_code == 200:
                print(f"✅ HTTP server started on port {self.port}")
                return True
            else:
                print(f"❌ Server not responding properly")
                return False
                
        except Exception as e:
            print(f"❌ Failed to start server: {e}")
            return False
    
    def stop_server(self):
        """Stop the HTTP server"""
        if hasattr(self, 'server_process'):
            self.server_process.terminate()
            self.server_process.wait()
            print("🛑 HTTP server stopped")
    
    def test_file_accessibility(self) -> Dict[str, Any]:
        """Test if all required files are accessible"""
        results = {}
        
        files_to_test = [
            'kepler-fixed.html',
            'kepler_ground_stations.json',
            'kepler_ground_stations.csv'
        ]
        
        for file_path in files_to_test:
            try:
                response = requests.get(f"{self.base_url}/{file_path}", timeout=10)
                results[file_path] = {
                    'accessible': response.status_code == 200,
                    'status_code': response.status_code,
                    'size': len(response.content) if response.status_code == 200 else 0
                }
                if response.status_code == 200:
                    print(f"✅ {file_path} - {len(response.content)} bytes")
                else:
                    print(f"❌ {file_path} - HTTP {response.status_code}")
                    
            except Exception as e:
                results[file_path] = {
                    'accessible': False, 
                    'error': str(e),
                    'size': 0
                }
                print(f"❌ {file_path} - Error: {e}")
        
        return results
    
    def test_html_structure(self) -> Dict[str, Any]:
        """Test HTML file structure and dependencies"""
        try:
            with open('kepler-fixed.html', 'r') as f:
                html_content = f.read()
                
            results = {
                'has_kepler_dependency': 'keplergl.min.js' in html_content,
                'has_react_dependency': 'react.production.min.js' in html_content,
                'has_redux_dependency': 'redux' in html_content,
                'has_data_loading': 'kepler_ground_stations.json' in html_content,
                'has_error_handling': 'showError' in html_content,
                'has_debug_info': 'showDebugInfo' in html_content,
                'file_size': len(html_content)
            }
            
            print("🔍 HTML Structure Analysis:")
            for key, value in results.items():
                status = "✅" if value else "❌"
                print(f"   {status} {key.replace('_', ' ').title()}: {value}")
                
            return results
            
        except Exception as e:
            print(f"❌ Error analyzing HTML: {e}")
            return {'error': str(e)}
    
    def test_data_quality(self) -> Dict[str, Any]:
        """Test data quality and Kepler.gl compatibility"""
        try:
            with open('kepler_ground_stations.json', 'r') as f:
                data = json.load(f)
                
            stations = data.get('data', {}).get('allData', [])
            
            # Test data quality
            results = {
                'total_stations': len(stations),
                'has_coordinates': all('latitude' in s and 'longitude' in s for s in stations),
                'has_scores': all('overall_investment_score' in s for s in stations),
                'has_colors': all('color' in s for s in stations),
                'has_tooltips': all('tooltip' in s for s in stations),
                'coordinate_ranges': self._get_coordinate_ranges(stations),
                'score_distribution': self._get_score_distribution(stations),
                'recommendation_counts': self._get_recommendation_counts(stations)
            }
            
            print("🔍 Data Quality Analysis:")
            print(f"   ✅ Total Stations: {results['total_stations']}")
            print(f"   {'✅' if results['has_coordinates'] else '❌'} All have coordinates: {results['has_coordinates']}")
            print(f"   {'✅' if results['has_scores'] else '❌'} All have scores: {results['has_scores']}")
            print(f"   {'✅' if results['has_colors'] else '❌'} All have colors: {results['has_colors']}")
            print(f"   Coordinate ranges: {results['coordinate_ranges']}")
            print(f"   Score range: {results['score_distribution']}")
            print(f"   Recommendations: {results['recommendation_counts']}")
            
            return results
            
        except Exception as e:
            print(f"❌ Error analyzing data: {e}")
            return {'error': str(e)}
    
    def test_kepler_config(self) -> Dict[str, Any]:
        """Test Kepler.gl configuration validity"""
        try:
            with open('kepler_ground_stations.json', 'r') as f:
                data = json.load(f)
                
            config = data.get('config', {})
            vis_state = config.get('config', {}).get('visState', {})
            
            results = {
                'has_config': bool(config),
                'has_layers': bool(vis_state.get('layers')),
                'has_tooltip_config': bool(vis_state.get('interactionConfig', {}).get('tooltip')),
                'has_map_state': bool(config.get('config', {}).get('mapState')),
                'layer_count': len(vis_state.get('layers', [])),
                'layer_types': [layer.get('type') for layer in vis_state.get('layers', [])],
                'color_field': vis_state.get('layers', [{}])[0].get('config', {}).get('colorField', {}).get('name') if vis_state.get('layers') else None,
                'size_field': vis_state.get('layers', [{}])[0].get('config', {}).get('sizeField', {}).get('name') if vis_state.get('layers') else None
            }
            
            print("🔍 Kepler.gl Configuration Analysis:")
            print(f"   {'✅' if results['has_config'] else '❌'} Has configuration: {results['has_config']}")
            print(f"   {'✅' if results['has_layers'] else '❌'} Has layers: {results['has_layers']}")
            print(f"   {'✅' if results['has_tooltip_config'] else '❌'} Has tooltip config: {results['has_tooltip_config']}")
            print(f"   Layer count: {results['layer_count']}")
            print(f"   Layer types: {results['layer_types']}")
            print(f"   Color field: {results['color_field']}")
            print(f"   Size field: {results['size_field']}")
            
            return results
            
        except Exception as e:
            print(f"❌ Error analyzing config: {e}")
            return {'error': str(e)}
    
    def _get_coordinate_ranges(self, stations):
        """Get coordinate ranges"""
        if not stations:
            return {}
            
        lats = [s.get('latitude', 0) for s in stations if 'latitude' in s]
        lngs = [s.get('longitude', 0) for s in stations if 'longitude' in s]
        
        return {
            'lat_range': f"{min(lats):.2f} to {max(lats):.2f}",
            'lng_range': f"{min(lngs):.2f} to {max(lngs):.2f}"
        }
    
    def _get_score_distribution(self, stations):
        """Get score distribution"""
        scores = [s.get('overall_investment_score', 0) for s in stations if 'overall_investment_score' in s]
        if not scores:
            return {}
            
        return {
            'min': min(scores),
            'max': max(scores),
            'avg': sum(scores) / len(scores)
        }
    
    def _get_recommendation_counts(self, stations):
        """Get recommendation counts"""
        recommendations = [s.get('investment_recommendation', 'unknown') for s in stations]
        counts = {}
        for rec in recommendations:
            counts[rec] = counts.get(rec, 0) + 1
        return counts
    
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run all tests and return comprehensive results"""
        print("🚀 Starting Comprehensive Kepler.gl Solution Test")
        print("="*60)
        
        all_results = {}
        
        # Start server
        if not self.start_server():
            return {'error': 'Failed to start HTTP server'}
        
        try:
            # Run all tests
            print("\n1. Testing File Accessibility...")
            all_results['file_accessibility'] = self.test_file_accessibility()
            
            print("\n2. Testing HTML Structure...")
            all_results['html_structure'] = self.test_html_structure()
            
            print("\n3. Testing Data Quality...")
            all_results['data_quality'] = self.test_data_quality()
            
            print("\n4. Testing Kepler Configuration...")
            all_results['kepler_config'] = self.test_kepler_config()
            
        finally:
            # Always stop server
            self.stop_server()
        
        return all_results
    
    def print_summary(self, results: Dict[str, Any]):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        if 'error' in results:
            print(f"❌ CRITICAL ERROR: {results['error']}")
            return
        
        # Overall assessment
        issues = []
        
        # Check file accessibility
        if 'file_accessibility' in results:
            files = results['file_accessibility']
            inaccessible = [f for f, data in files.items() if not data.get('accessible', False)]
            if inaccessible:
                issues.append(f"Inaccessible files: {inaccessible}")
        
        # Check HTML structure
        if 'html_structure' in results:
            html = results['html_structure']
            missing_deps = [key for key, value in html.items() 
                          if key.startswith('has_') and not value]
            if missing_deps:
                issues.append(f"Missing HTML dependencies: {missing_deps}")
        
        # Check data quality
        if 'data_quality' in results:
            data = results['data_quality']
            if not data.get('has_coordinates', True):
                issues.append("Missing coordinate data")
            if not data.get('has_scores', True):
                issues.append("Missing investment scores")
        
        if not issues:
            print("✅ ALL TESTS PASSED")
            print("\n🎯 Solution is ready for use!")
            print(f"   • Open: http://localhost:8080/kepler-fixed.html")
            print(f"   • Data file: kepler_ground_stations.json")
            print(f"   • {results.get('data_quality', {}).get('total_stations', 0)} ground stations ready for visualization")
        else:
            print("⚠️  ISSUES FOUND:")
            for issue in issues:
                print(f"   • {issue}")
        
        print("\n📋 Detailed Results:")
        for test_name, test_results in results.items():
            if isinstance(test_results, dict) and 'error' not in test_results:
                print(f"   {test_name}: PASSED")
            else:
                print(f"   {test_name}: {'FAILED' if 'error' in test_results else 'PASSED'}")
        
        print("\n" + "="*60)

def main():
    """Main test function"""
    tester = KeplerSolutionTester()
    results = tester.run_comprehensive_test()
    tester.print_summary(results)

if __name__ == "__main__":
    main()