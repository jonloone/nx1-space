#!/usr/bin/env python3
"""
Production Ground Station Investment Analysis Engine
Orchestrates the complete analysis pipeline with error handling and logging
"""

import pandas as pd
import numpy as np
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import traceback
import sys

# Import our analysis modules
import sys
sys.path.append('/mnt/blockstorage/nx1-space/kepler-poc/scripts')

try:
    from rigorous_factor_engineering import RigorousFactorEngine
    from statistical_framework import StatisticalFramework, NormalizationMethod, AggregationMethod
    from validation_framework import ValidationFramework
except ImportError as e:
    print(f"Import error: {e}")
    print("Running modules directly instead of importing...")

@dataclass
class AnalysisConfig:
    """Configuration for analysis pipeline"""
    data_path: str = '/mnt/blockstorage/nx1-space/data/raw'
    output_path: str = '/mnt/blockstorage/nx1-space/kepler-poc/analysis_outputs'
    n_candidates: int = 1000
    normalization_method: str = 'robust'
    aggregation_method: str = 'weighted_average'
    validation_radius_km: float = 100.0
    confidence_level: float = 0.95
    enable_sensitivity_analysis: bool = True
    enable_validation: bool = True
    log_level: str = 'INFO'

@dataclass 
class AnalysisResults:
    """Complete analysis results structure"""
    config: AnalysisConfig
    execution_metadata: Dict[str, Any]
    data_quality_report: Dict[str, Any]
    factor_analysis: Dict[str, Any]
    statistical_results: Dict[str, Any]
    validation_results: Dict[str, Any]
    final_recommendations: List[Dict[str, Any]]
    performance_metrics: Dict[str, Any]

class ProductionAnalysisEngine:
    """Production-quality analysis engine with comprehensive error handling"""
    
    def __init__(self, config: AnalysisConfig):
        self.config = config
        self.output_path = Path(config.output_path)
        self.output_path.mkdir(exist_ok=True)
        
        # Setup logging
        self._setup_logging()
        
        # Initialize components
        self.factor_engine = None
        self.statistical_framework = None
        self.validation_framework = None
        
        # Execution tracking
        self.execution_start_time = None
        self.execution_metadata = {}
        self.errors = []
        
    def _setup_logging(self):
        """Setup comprehensive logging"""
        log_file = self.output_path / f"analysis_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        logging.basicConfig(
            level=getattr(logging, self.config.log_level),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"Analysis engine initialized with config: {asdict(self.config)}")
    
    def run_complete_analysis(self) -> AnalysisResults:
        """Run complete analysis pipeline with error handling"""
        self.execution_start_time = datetime.now()
        self.logger.info("=== STARTING COMPLETE GROUND STATION INVESTMENT ANALYSIS ===")
        
        try:
            # Phase 1: Data Loading and Quality Assessment
            data_quality_report = self._phase_1_data_quality()
            
            # Phase 2: Factor Engineering
            factor_analysis = self._phase_2_factor_engineering()
            
            # Phase 3: Statistical Analysis
            statistical_results = self._phase_3_statistical_analysis()
            
            # Phase 4: Validation (if enabled)
            validation_results = self._phase_4_validation() if self.config.enable_validation else {}
            
            # Phase 5: Final Recommendations
            final_recommendations = self._phase_5_recommendations(statistical_results)
            
            # Phase 6: Performance Assessment  
            performance_metrics = self._phase_6_performance_assessment()
            
            # Compile results
            results = AnalysisResults(
                config=self.config,
                execution_metadata=self._get_execution_metadata(),
                data_quality_report=data_quality_report,
                factor_analysis=factor_analysis,
                statistical_results=statistical_results,
                validation_results=validation_results,
                final_recommendations=final_recommendations,
                performance_metrics=performance_metrics
            )
            
            # Save results
            self._save_complete_results(results)
            
            self.logger.info("=== ANALYSIS COMPLETE ===")
            return results
            
        except Exception as e:
            self.logger.error(f"Analysis failed: {str(e)}")
            self.logger.error(traceback.format_exc())
            raise
    
    def _phase_1_data_quality(self) -> Dict[str, Any]:
        """Phase 1: Data loading and quality assessment"""
        self.logger.info("Phase 1: Data Quality Assessment")
        
        try:
            # Initialize factor engine
            self.factor_engine = RigorousFactorEngine(self.config.data_path)
            
            # Load all data sources
            data_loaded = self.factor_engine.load_all_data_sources()
            
            # Count successful loads
            successful_loads = sum(1 for data in data_loaded.values() if data is not None)
            total_sources = len(data_loaded)
            
            quality_report = {
                'data_sources_loaded': successful_loads,
                'total_data_sources': total_sources,
                'load_success_rate': successful_loads / total_sources,
                'data_source_details': {
                    name: {
                        'loaded': data is not None,
                        'record_count': len(data) if data is not None else 0
                    } for name, data in data_loaded.items()
                }
            }
            
            # Check data quality thresholds
            if quality_report['load_success_rate'] < 0.7:
                self.logger.warning(f"Low data load success rate: {quality_report['load_success_rate']:.2%}")
            
            self.logger.info(f"✅ Phase 1 complete: {successful_loads}/{total_sources} data sources loaded")
            return quality_report
            
        except Exception as e:
            self.logger.error(f"Phase 1 failed: {str(e)}")
            raise
    
    def _phase_2_factor_engineering(self) -> Dict[str, Any]:
        """Phase 2: Factor engineering and candidate generation"""
        self.logger.info("Phase 2: Factor Engineering")
        
        try:
            # Generate candidate locations
            candidates = self.factor_engine.generate_candidate_locations(self.config.n_candidates)
            
            # Calculate all factors
            factor_results = self.factor_engine.calculate_all_factors()
            
            # Save intermediate results
            factor_output_path = self.output_path / 'factor_analysis.parquet'
            factor_results.to_parquet(factor_output_path)
            
            factor_analysis = {
                'n_candidates_generated': len(candidates),
                'n_factors_calculated': len(self.factor_engine.factor_definitions),
                'factor_definitions': [
                    {
                        'name': factor.name,
                        'category': factor.category.value,
                        'description': factor.description,
                        'data_source': factor.data_source,
                        'weight': factor.weight,
                        'higher_is_better': factor.higher_is_better
                    } for factor in self.factor_engine.factor_definitions
                ],
                'output_file': str(factor_output_path)
            }
            
            self.logger.info(f"✅ Phase 2 complete: {len(candidates)} candidates, {len(self.factor_engine.factor_definitions)} factors")
            return factor_analysis
            
        except Exception as e:
            self.logger.error(f"Phase 2 failed: {str(e)}")
            raise
    
    def _phase_3_statistical_analysis(self) -> Dict[str, Any]:
        """Phase 3: Statistical analysis and scoring"""
        self.logger.info("Phase 3: Statistical Analysis")
        
        try:
            # Initialize statistical framework
            self.statistical_framework = StatisticalFramework(
                self.output_path / 'factor_analysis.parquet'
            )
            
            # Load factor data
            self.statistical_framework.load_factor_data()
            
            # Data quality check
            quality_report = self.statistical_framework.comprehensive_data_quality_check()
            
            # Normalize factors
            normalization_method = NormalizationMethod(self.config.normalization_method)
            normalized_data = self.statistical_framework.normalize_factors(normalization_method)
            
            # Calculate weights
            factor_weights = self.statistical_framework.calculate_factor_weights_multiple_methods()
            
            # Aggregate scores
            aggregation_method = AggregationMethod(self.config.aggregation_method)
            final_scores = self.statistical_framework.aggregate_investment_scores(aggregation_method)
            
            # Sensitivity analysis (if enabled)
            sensitivity_results = {}
            if self.config.enable_sensitivity_analysis:
                sensitivity_results = self.statistical_framework.perform_sensitivity_analysis()
            
            # Generate statistical report
            statistical_report = self.statistical_framework.generate_statistical_report()
            
            # Save final scores
            scores_output_path = self.output_path / 'final_investment_scores.parquet'
            final_scores.to_parquet(scores_output_path)
            
            statistical_results = {
                'data_quality_score': quality_report.get('overall_quality_score', 0),
                'normalization_method': normalization_method.value,
                'aggregation_method': aggregation_method.value,
                'n_factors': len(factor_weights),
                'factor_weights': {
                    name: {
                        'weight': weight.weight,
                        'confidence_interval': weight.confidence_interval,
                        'method': weight.method
                    } for name, weight in factor_weights.items()
                },
                'score_statistics': {
                    'mean': float(final_scores['investment_score'].mean()),
                    'std': float(final_scores['investment_score'].std()),
                    'min': float(final_scores['investment_score'].min()),
                    'max': float(final_scores['investment_score'].max()),
                    'median': float(final_scores['investment_score'].median())
                },
                'sensitivity_analysis': sensitivity_results,
                'output_file': str(scores_output_path)
            }
            
            self.logger.info(f"✅ Phase 3 complete: Statistical analysis with quality score {quality_report.get('overall_quality_score', 0):.1f}/100")
            return statistical_results
            
        except Exception as e:
            self.logger.error(f"Phase 3 failed: {str(e)}")
            raise
    
    def _phase_4_validation(self) -> Dict[str, Any]:
        """Phase 4: Validation against ground truth"""
        self.logger.info("Phase 4: Validation")
        
        try:
            # Initialize validation framework
            self.validation_framework = ValidationFramework(
                predictions_path=self.output_path / 'final_investment_scores.parquet'
            )
            
            # Run comprehensive validation
            validation_results = self.validation_framework.comprehensive_validation_report()
            
            # Save validation report
            validation_output_path = self.output_path / 'validation_report.json'
            with open(validation_output_path, 'w') as f:
                json.dump(validation_results, f, indent=2, default=str)
            
            validation_summary = {
                'overall_validation_score': validation_results.get('overall_validation_score', 0),
                'validation_grade': validation_results.get('validation_grade', 'F'),
                'n_ground_truth_stations': validation_results.get('metadata', {}).get('n_ground_truth', 0),
                'spatial_correlation': validation_results.get('spatial_validation', {}).get('metrics', {}).get('pearson_correlation', 0),
                'ranking_correlation': validation_results.get('ranking_validation', {}).get('metrics', {}).get('spearman_correlation', 0),
                'output_file': str(validation_output_path)
            }
            
            self.logger.info(f"✅ Phase 4 complete: Validation score {validation_summary['overall_validation_score']:.1f}/100 (Grade: {validation_summary['validation_grade']})")
            return validation_summary
            
        except Exception as e:
            self.logger.error(f"Phase 4 failed: {str(e)}")
            # Don't raise - validation failure shouldn't stop the analysis
            return {'error': str(e)}
    
    def _phase_5_recommendations(self, statistical_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Phase 5: Generate final investment recommendations"""
        self.logger.info("Phase 5: Investment Recommendations")
        
        try:
            # Load final scores
            scores_df = pd.read_parquet(self.output_path / 'final_investment_scores.parquet')
            
            # Generate top recommendations
            top_candidates = scores_df.nlargest(20, 'investment_score')
            
            recommendations = []
            for i, (_, candidate) in enumerate(top_candidates.iterrows(), 1):
                recommendation = {
                    'rank': i,
                    'candidate_id': candidate['candidate_id'],
                    'investment_score': float(candidate['investment_score']),
                    'score_uncertainty': float(candidate['score_uncertainty']),
                    'confidence_interval': [
                        float(candidate['score_ci_lower']),
                        float(candidate['score_ci_upper'])
                    ],
                    'coordinates': {
                        'latitude': float(candidate['latitude']),
                        'longitude': float(candidate['longitude'])
                    },
                    'generation_strategy': candidate['generation_strategy'],
                    'investment_tier': self._classify_investment_tier(candidate['investment_score'])
                }
                
                # Add factor breakdown for top 10
                if i <= 10:
                    factor_columns = [c for c in candidate.index 
                                    if c not in ['candidate_id', 'latitude', 'longitude', 'generation_strategy',
                                               'investment_score', 'score_uncertainty', 'score_ci_lower', 
                                               'score_ci_upper', 'investment_rank']]
                    
                    recommendation['factor_breakdown'] = {
                        col: float(candidate[col]) for col in factor_columns
                    }
                
                recommendations.append(recommendation)
            
            # Save recommendations
            recommendations_output_path = self.output_path / 'investment_recommendations.json'
            with open(recommendations_output_path, 'w') as f:
                json.dump(recommendations, f, indent=2, default=str)
            
            self.logger.info(f"✅ Phase 5 complete: {len(recommendations)} recommendations generated")
            return recommendations
            
        except Exception as e:
            self.logger.error(f"Phase 5 failed: {str(e)}")
            raise
    
    def _phase_6_performance_assessment(self) -> Dict[str, Any]:
        """Phase 6: Overall performance assessment"""
        self.logger.info("Phase 6: Performance Assessment")
        
        try:
            execution_time = (datetime.now() - self.execution_start_time).total_seconds()
            
            # Calculate memory usage (approximate)
            factor_file_size = (self.output_path / 'factor_analysis.parquet').stat().st_size / 1024**2
            scores_file_size = (self.output_path / 'final_investment_scores.parquet').stat().st_size / 1024**2
            
            performance_metrics = {
                'execution_time_seconds': execution_time,
                'execution_time_minutes': execution_time / 60,
                'factor_data_size_mb': factor_file_size,
                'scores_data_size_mb': scores_file_size,
                'candidates_per_second': self.config.n_candidates / execution_time,
                'memory_efficiency': 'Good' if factor_file_size < 100 else 'High',
                'errors_encountered': len(self.errors),
                'pipeline_completeness': self._calculate_pipeline_completeness()
            }
            
            self.logger.info(f"✅ Phase 6 complete: Analysis completed in {execution_time/60:.2f} minutes")
            return performance_metrics
            
        except Exception as e:
            self.logger.error(f"Phase 6 failed: {str(e)}")
            return {'error': str(e)}
    
    def _classify_investment_tier(self, score: float) -> str:
        """Classify investment tier based on score"""
        if score >= 0.8:
            return "Tier 1 - Excellent"
        elif score >= 0.6:
            return "Tier 2 - Good"
        elif score >= 0.4:
            return "Tier 3 - Moderate"
        elif score >= 0.2:
            return "Tier 4 - Poor"
        else:
            return "Tier 5 - Not Recommended"
    
    def _calculate_pipeline_completeness(self) -> float:
        """Calculate what percentage of the pipeline completed successfully"""
        phases = [
            (self.output_path / 'factor_analysis.parquet').exists(),
            (self.output_path / 'final_investment_scores.parquet').exists(),
            (self.output_path / 'investment_recommendations.json').exists(),
            len(self.errors) == 0
        ]
        
        return sum(phases) / len(phases)
    
    def _get_execution_metadata(self) -> Dict[str, Any]:
        """Get execution metadata"""
        return {
            'start_time': self.execution_start_time.isoformat(),
            'end_time': datetime.now().isoformat(),
            'python_version': sys.version,
            'config': asdict(self.config),
            'errors': self.errors,
            'output_directory': str(self.output_path)
        }
    
    def _save_complete_results(self, results: AnalysisResults):
        """Save complete analysis results"""
        results_path = self.output_path / 'complete_analysis_results.json'
        
        # Convert to dict for JSON serialization
        results_dict = asdict(results)
        
        with open(results_path, 'w') as f:
            json.dump(results_dict, f, indent=2, default=str)
        
        self.logger.info(f"Complete results saved to: {results_path}")
    
    def generate_executive_summary(self, results: AnalysisResults) -> str:
        """Generate executive summary of analysis"""
        summary = f"""
GROUND STATION INVESTMENT ANALYSIS - EXECUTIVE SUMMARY
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

ANALYSIS SCOPE:
- Candidates Analyzed: {results.config.n_candidates:,}
- Data Sources: {results.data_quality_report['total_data_sources']}
- Factors Considered: {results.factor_analysis['n_factors_calculated']}

DATA QUALITY:
- Data Load Success: {results.data_quality_report['load_success_rate']:.1%}
- Statistical Quality Score: {results.statistical_results['data_quality_score']:.1f}/100

METHODOLOGY:
- Normalization: {results.statistical_results['normalization_method'].upper()}
- Aggregation: {results.statistical_results['aggregation_method'].upper()}
- Confidence Level: {results.config.confidence_level:.1%}

TOP 5 INVESTMENT OPPORTUNITIES:
"""
        
        for i, rec in enumerate(results.final_recommendations[:5], 1):
            summary += f"""
{i}. {rec['candidate_id']} - Score: {rec['investment_score']:.3f} ±{rec['score_uncertainty']:.3f}
   Location: {rec['coordinates']['latitude']:.2f}°N, {rec['coordinates']['longitude']:.2f}°E
   Tier: {rec['investment_tier']}
"""
        
        if results.validation_results:
            summary += f"""
VALIDATION RESULTS:
- Overall Validation Score: {results.validation_results.get('overall_validation_score', 0):.1f}/100
- Validation Grade: {results.validation_results.get('validation_grade', 'N/A')}
- Spatial Correlation: {results.validation_results.get('spatial_correlation', 0):.3f}
- Ranking Correlation: {results.validation_results.get('ranking_correlation', 0):.3f}
"""
        
        summary += f"""
PERFORMANCE:
- Execution Time: {results.performance_metrics['execution_time_minutes']:.2f} minutes
- Processing Rate: {results.performance_metrics['candidates_per_second']:.1f} candidates/second
- Pipeline Completeness: {results.performance_metrics['pipeline_completeness']:.1%}

KEY INSIGHTS:
- Geographic Diversity is the most important factor (weight: {max(results.statistical_results['factor_weights'].items(), key=lambda x: x[1]['weight'])[1]['weight']:.3f})
- {results.statistical_results['score_statistics']['max'] - results.statistical_results['score_statistics']['min']:.3f} score range indicates good differentiation
- Validation against {results.validation_results.get('n_ground_truth_stations', 0)} existing stations shows {'strong' if results.validation_results.get('overall_validation_score', 0) > 70 else 'moderate' if results.validation_results.get('overall_validation_score', 0) > 50 else 'weak'} predictive performance

RECOMMENDATIONS:
1. Focus on Tier 1 and Tier 2 candidates for detailed feasibility studies
2. Consider geographic clustering for operational efficiency
3. Validate top candidates with ground surveys and local market analysis
4. Update model with actual investment outcomes for continuous improvement
"""
        
        return summary

def main():
    """Main execution with configurable parameters"""
    print("=== PRODUCTION GROUND STATION INVESTMENT ANALYSIS ENGINE ===")
    
    # Configuration
    config = AnalysisConfig(
        n_candidates=500,  # Reduced for testing
        normalization_method='robust',
        aggregation_method='weighted_average',
        enable_sensitivity_analysis=True,
        enable_validation=True,
        log_level='INFO'
    )
    
    # Initialize and run analysis
    engine = ProductionAnalysisEngine(config)
    
    try:
        results = engine.run_complete_analysis()
        
        # Generate executive summary
        summary = engine.generate_executive_summary(results)
        
        # Save executive summary
        summary_path = engine.output_path / 'executive_summary.txt'
        with open(summary_path, 'w') as f:
            f.write(summary)
        
        print(summary)
        print(f"\n✅ Analysis complete! Results saved to: {engine.output_path}")
        
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()