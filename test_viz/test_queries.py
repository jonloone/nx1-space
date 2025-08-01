"""
Query Performance Testing Suite
Tests key queries that will be demonstrated in GraphXR
"""

import json
import time
from typing import Dict, List, Any
from colorama import Fore, Style, init
import pandas as pd

init(autoreset=True)

class QueryTester:
    """Test and benchmark graph queries"""
    
    def __init__(self, export_path: str = "data/graphxr_export.json"):
        self.export_path = export_path
        self.graph_data = None
        self.nodes_by_id = {}
        self.edges_by_type = {}
        self.results = []
        
    def load_data(self) -> bool:
        """Load and index the graph data"""
        print(f"{Fore.CYAN}Loading graph data...{Style.RESET_ALL}")
        
        try:
            with open(self.export_path, 'r') as f:
                self.graph_data = json.load(f)
            
            # Index nodes by ID for fast lookup
            self.nodes_by_id = {n['id']: n for n in self.graph_data['nodes']}
            
            # Index edges by type
            for edge in self.graph_data['edges']:
                edge_type = edge['label']
                if edge_type not in self.edges_by_type:
                    self.edges_by_type[edge_type] = []
                self.edges_by_type[edge_type].append(edge)
            
            print(f"{Fore.GREEN}✓ Loaded {len(self.nodes_by_id)} nodes and {len(self.graph_data['edges'])} edges{Style.RESET_ALL}")
            return True
            
        except Exception as e:
            print(f"{Fore.RED}❌ Failed to load data: {e}{Style.RESET_ALL}")
            return False
    
    def benchmark_query(self, query_name: str, query_func):
        """Benchmark a query function"""
        print(f"\n{Fore.CYAN}Running: {query_name}{Style.RESET_ALL}")
        
        start_time = time.time()
        try:
            results = query_func()
            elapsed = time.time() - start_time
            
            self.results.append({
                'query': query_name,
                'success': True,
                'time_ms': elapsed * 1000,
                'result_count': len(results) if isinstance(results, list) else 1,
                'results': results
            })
            
            print(f"{Fore.GREEN}✓ Completed in {elapsed*1000:.2f}ms - {len(results)} results{Style.RESET_ALL}")
            return results
            
        except Exception as e:
            elapsed = time.time() - start_time
            self.results.append({
                'query': query_name,
                'success': False,
                'time_ms': elapsed * 1000,
                'error': str(e)
            })
            
            print(f"{Fore.RED}❌ Failed: {e}{Style.RESET_ALL}")
            return None
    
    def query_investment_opportunities(self) -> List[Dict[str, Any]]:
        """Find underutilized stations in high-demand areas"""
        results = []
        
        # Get all SERVES edges
        serves_edges = self.edges_by_type.get('SERVES', [])
        
        for edge in serves_edges:
            station_id = edge['source']
            region_id = edge['target']
            
            station = self.nodes_by_id.get(station_id)
            region = self.nodes_by_id.get(region_id)
            
            if station and region:
                station_props = station.get('properties', {})
                region_props = region.get('properties', {})
                
                utilization = station_props.get('utilization_rate', 100)
                connectivity_gap = region_props.get('connectivity_gap', 0)
                investment_score = station_props.get('investment_score', 0)
                
                # Apply filters
                if utilization < 40 and connectivity_gap > 70 and investment_score > 60:
                    results.append({
                        'station_id': station_id,
                        'station_name': station_props.get('name', 'Unknown'),
                        'utilization_rate': utilization,
                        'investment_score': investment_score,
                        'region_name': region_props.get('name', 'Unknown'),
                        'connectivity_gap': connectivity_gap
                    })
        
        # Sort by connectivity gap (highest first)
        results.sort(key=lambda x: x['connectivity_gap'], reverse=True)
        return results[:10]  # Top 10
    
    def query_critical_bridges(self) -> List[Dict[str, Any]]:
        """Find high-value network bridges"""
        results = []
        
        bridges = self.edges_by_type.get('BRIDGES_WITH', [])
        
        for edge in bridges:
            props = edge.get('properties', {})
            criticality = props.get('criticality_score', 0)
            value = props.get('value_usd_annual', 0)
            
            if criticality > 80 and value > 5000000:
                station1 = self.nodes_by_id.get(edge['source'])
                station2 = self.nodes_by_id.get(edge['target'])
                
                if station1 and station2:
                    results.append({
                        'station1_id': edge['source'],
                        'station1_name': station1.get('properties', {}).get('name', 'Unknown'),
                        'station2_id': edge['target'],
                        'station2_name': station2.get('properties', {}).get('name', 'Unknown'),
                        'bridge_type': props.get('bridge_type', 'Unknown'),
                        'criticality_score': criticality,
                        'value_usd_annual': value
                    })
        
        # Sort by value (highest first)
        results.sort(key=lambda x: x['value_usd_annual'], reverse=True)
        return results[:5]  # Top 5
    
    def query_weather_vulnerabilities(self) -> List[Dict[str, Any]]:
        """Find stations with significant weather impact"""
        results = []
        
        affected_edges = self.edges_by_type.get('AFFECTED_BY', [])
        
        for edge in affected_edges:
            props = edge.get('properties', {})
            downtime = props.get('annual_downtime_hours', 0)
            
            if downtime > 100:
                station = self.nodes_by_id.get(edge['source'])
                weather = self.nodes_by_id.get(edge['target'])
                
                if station and weather:
                    station_props = station.get('properties', {})
                    weather_props = weather.get('properties', {})
                    
                    # Only include reliable stations affected by weather
                    if station_props.get('reliability_score', 0) > 70:
                        results.append({
                            'station_id': edge['source'],
                            'station_name': station_props.get('name', 'Unknown'),
                            'reliability_score': station_props.get('reliability_score', 0),
                            'weather_pattern': weather_props.get('pattern_type', 'Unknown'),
                            'annual_downtime_hours': downtime,
                            'impact_severity': props.get('impact_severity', 'Unknown')
                        })
        
        # Sort by downtime (highest first)
        results.sort(key=lambda x: x['annual_downtime_hours'], reverse=True)
        return results[:10]  # Top 10
    
    def query_network_statistics(self) -> Dict[str, Any]:
        """Calculate overall network statistics"""
        # Node statistics
        node_stats = {}
        for node in self.graph_data['nodes']:
            node_type = node['label']
            node_stats[node_type] = node_stats.get(node_type, 0) + 1
        
        # Edge statistics
        edge_stats = {edge_type: len(edges) for edge_type, edges in self.edges_by_type.items()}
        
        # Coverage statistics
        total_stations = sum(1 for n in self.graph_data['nodes'] if n['label'] == 'GroundStation')
        high_investment = sum(
            1 for n in self.graph_data['nodes'] 
            if n['label'] == 'GroundStation' and n.get('properties', {}).get('investment_score', 0) > 70
        )
        
        return {
            'node_counts': node_stats,
            'edge_counts': edge_stats,
            'total_nodes': len(self.graph_data['nodes']),
            'total_edges': len(self.graph_data['edges']),
            'coverage_metrics': {
                'total_ground_stations': total_stations,
                'high_investment_stations': high_investment,
                'investment_ratio': round(high_investment / total_stations * 100, 2) if total_stations > 0 else 0
            }
        }
    
    def query_geographic_distribution(self) -> Dict[str, Any]:
        """Analyze geographic distribution of stations"""
        stations = [
            n for n in self.graph_data['nodes'] 
            if n['label'] == 'GroundStation'
        ]
        
        lat_bounds = {'min': 90, 'max': -90}
        lon_bounds = {'min': 180, 'max': -180}
        
        operator_types = {}
        
        for station in stations:
            props = station.get('properties', {})
            lat = props.get('latitude', 0)
            lon = props.get('longitude', 0)
            op_type = props.get('operator_type', 'Unknown')
            
            # Update bounds
            lat_bounds['min'] = min(lat_bounds['min'], lat)
            lat_bounds['max'] = max(lat_bounds['max'], lat)
            lon_bounds['min'] = min(lon_bounds['min'], lon)
            lon_bounds['max'] = max(lon_bounds['max'], lon)
            
            # Count operator types
            operator_types[op_type] = operator_types.get(op_type, 0) + 1
        
        return {
            'total_stations': len(stations),
            'latitude_range': lat_bounds,
            'longitude_range': lon_bounds,
            'geographic_span': {
                'lat_span': lat_bounds['max'] - lat_bounds['min'],
                'lon_span': lon_bounds['max'] - lon_bounds['min']
            },
            'operator_distribution': operator_types
        }
    
    def print_query_results(self, query_name: str, results: Any):
        """Pretty print query results"""
        print(f"\n{Fore.YELLOW}Results for: {query_name}{Style.RESET_ALL}")
        
        if isinstance(results, list):
            if len(results) == 0:
                print("  No results found")
            else:
                # Show first 3 results
                for i, result in enumerate(results[:3]):
                    print(f"\n  Result {i+1}:")
                    for key, value in result.items():
                        if isinstance(value, float):
                            if 'usd' in key:
                                print(f"    {key}: ${value:,.2f}")
                            else:
                                print(f"    {key}: {value:.2f}")
                        else:
                            print(f"    {key}: {value}")
                
                if len(results) > 3:
                    print(f"\n  ... and {len(results) - 3} more results")
        
        elif isinstance(results, dict):
            for key, value in results.items():
                if isinstance(value, dict):
                    print(f"  {key}:")
                    for sub_key, sub_value in value.items():
                        print(f"    {sub_key}: {sub_value}")
                else:
                    print(f"  {key}: {value}")
    
    def generate_performance_report(self):
        """Generate a performance summary report"""
        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}📊 QUERY PERFORMANCE SUMMARY{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        
        # Create summary dataframe
        df_data = []
        for result in self.results:
            df_data.append({
                'Query': result['query'],
                'Status': '✅' if result['success'] else '❌',
                'Time (ms)': f"{result['time_ms']:.2f}",
                'Results': result.get('result_count', 'N/A')
            })
        
        df = pd.DataFrame(df_data)
        print(df.to_string(index=False))
        
        # Performance statistics
        successful_queries = [r for r in self.results if r['success']]
        if successful_queries:
            avg_time = sum(r['time_ms'] for r in successful_queries) / len(successful_queries)
            max_time = max(r['time_ms'] for r in successful_queries)
            
            print(f"\n{Fore.CYAN}Performance Metrics:{Style.RESET_ALL}")
            print(f"  Average query time: {avg_time:.2f}ms")
            print(f"  Max query time: {max_time:.2f}ms")
            print(f"  Success rate: {len(successful_queries)}/{len(self.results)} ({len(successful_queries)/len(self.results)*100:.0f}%)")
        
        # Save detailed report
        report_path = "test_viz/query_performance_report.json"
        with open(report_path, 'w') as f:
            json.dump({
                'test_time': time.strftime('%Y-%m-%d %H:%M:%S'),
                'results': self.results,
                'summary': {
                    'total_queries': len(self.results),
                    'successful': len(successful_queries),
                    'average_time_ms': avg_time if successful_queries else 0
                }
            }, f, indent=2)
        
        print(f"\n{Fore.GREEN}✓ Detailed report saved to: {report_path}{Style.RESET_ALL}")
    
    def run_all_tests(self):
        """Run all query tests"""
        if not self.load_data():
            return False
        
        print(f"\n{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}🚀 RUNNING QUERY PERFORMANCE TESTS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}")
        
        # Test 1: Investment Opportunities
        results = self.benchmark_query(
            "Investment Opportunities Query",
            self.query_investment_opportunities
        )
        if results:
            self.print_query_results("Investment Opportunities", results)
        
        # Test 2: Critical Bridges
        results = self.benchmark_query(
            "Critical Network Bridges Query",
            self.query_critical_bridges
        )
        if results:
            self.print_query_results("Critical Bridges", results)
        
        # Test 3: Weather Vulnerabilities
        results = self.benchmark_query(
            "Weather Vulnerability Query",
            self.query_weather_vulnerabilities
        )
        if results:
            self.print_query_results("Weather Vulnerabilities", results)
        
        # Test 4: Network Statistics
        results = self.benchmark_query(
            "Network Statistics Query",
            self.query_network_statistics
        )
        if results:
            self.print_query_results("Network Statistics", results)
        
        # Test 5: Geographic Distribution
        results = self.benchmark_query(
            "Geographic Distribution Query",
            self.query_geographic_distribution
        )
        if results:
            self.print_query_results("Geographic Distribution", results)
        
        # Generate performance report
        self.generate_performance_report()
        
        return True


def main():
    """Run the query test suite"""
    tester = QueryTester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n{Fore.GREEN}✅ All query tests completed successfully!{Style.RESET_ALL}")
        print(f"\n{Fore.CYAN}💡 These queries demonstrate the graph's capabilities:{Style.RESET_ALL}")
        print("   1. Finding investment opportunities based on utilization and demand")
        print("   2. Identifying critical infrastructure connections")
        print("   3. Analyzing weather-related vulnerabilities")
        print("   4. Providing network-wide statistics")
        print("   5. Understanding geographic distribution")
    else:
        print(f"\n{Fore.RED}❌ Query tests failed{Style.RESET_ALL}")
        return 1
    
    return 0


if __name__ == "__main__":
    import sys
    sys.exit(main())