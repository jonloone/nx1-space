# Kineviz GraphXR Import Guide

## 🎯 Overview

This guide provides step-by-step instructions for importing and visualizing the enhanced ground station investment intelligence data in Kineviz GraphXR.

## 📁 Import File

**Primary Export**: `data/enhanced_graphxr_export_v2.json`
- **158 nodes** with comprehensive properties
- **222 edges** showing relationships
- **33 ground stations** with enhanced investment analysis
- **Statistical confidence intervals** and professional metrics

## 🚀 Step-by-Step Import Process

### 1. **Open Kineviz GraphXR**
- Launch GraphXR application
- Create new project or open existing workspace

### 2. **Import Data**
```
File → Import → JSON
Select: enhanced_graphxr_export_v2.json
```

### 3. **Initial Layout Setup**
```
Layout → Geographic
- Use properties: latitude, longitude
- Apply to: GroundStation nodes
- This will position stations on a world map
```

### 4. **Node Styling**

#### **Size Nodes by Investment Score:**
```
Style → Node Size → enhanced_investment_score
- Min size: 5
- Max size: 25
- This makes higher-scoring stations larger
```

#### **Color Nodes by Recommendation:**
```
Style → Node Color → investment_recommendation
Color scheme:
- excellent: Green (#4CAF50)
- good: Light Green (#8BC34A)
- moderate: Orange (#FF9800)
- poor: Red (#F44336)
```

#### **Node Labels:**
```
Style → Node Labels → name
- Show on hover or always visible
- Font size: 12px
```

### 5. **Edge Styling**
```
Style → Edge Color → type
- SERVES: Blue (#2196F3)
- COMPETES_WITH: Red (#F44336)

Style → Edge Width → Default (2px)
Style → Edge Labels → type (show on hover)
```

### 6. **Create Filters**

#### **Investment Category Filter:**
```
Filter → Add → investment_recommendation
- Allow multi-select
- Default: All selected
```

#### **Confidence Level Filter:**
```
Filter → Add → confidence_level
- Options: high, medium, low
- Default: All selected
```

#### **Country Filter:**
```
Filter → Add → country_name
- Useful for regional analysis
- Default: All selected
```

#### **Service Capabilities Filter:**
```
Filter → Add → services_supported
- Filter by station capabilities
- Useful for service-specific analysis
```

### 7. **Advanced Visualization**

#### **Create Heatmap Overlay:**
```
Layer → Heatmap → enhanced_investment_score
- Shows investment opportunity density
- Useful for regional opportunity identification
```

#### **Add Confidence Intervals:**
```
Info Panel → Node Details
- Show: confidence_interval_lower, confidence_interval_upper
- Display format: "Score: 65.2 (±5.3)"
```

## 📊 Key Visualization Insights

### **Geographic Distribution**
- **Global Coverage**: Stations span multiple continents
- **Regional Clustering**: Some areas show higher station density
- **Investment Hotspots**: Concentrate on green/light-green nodes

### **Investment Analysis**
- **Score Range**: 41.2 - 67.5 (out of 100)
- **Average Score**: 58.8
- **Distribution**: 54.5% moderate, 45.5% poor opportunities
- **No Excellent**: Current POC data shows room for improvement

### **Professional Metrics**
- **G/T Values**: 23.0 dB/K (consistent across stations)
- **EIRP Values**: 66.0 dBW (standardized for POC)
- **Services**: Multiple service types per station

## 🎨 Recommended Visual Configurations

### **Configuration 1: Investment Overview**
```
Layout: Geographic
Node Size: enhanced_investment_score
Node Color: investment_recommendation
Filters: All active
Purpose: High-level investment opportunity assessment
```

### **Configuration 2: Risk Analysis**
```
Layout: Geographic
Node Size: data_quality
Node Color: confidence_level
Additional: Show confidence intervals
Purpose: Data quality and confidence assessment
```

### **Configuration 3: Technical Analysis**
```
Layout: Force-directed
Node Size: service_capability_score
Node Color: services_supported
Filter: Focus on specific service types
Purpose: Technical capability analysis
```

### **Configuration 4: Regional Focus**
```
Layout: Geographic (zoomed to region)
Filter: Specific countries/regions
Node Details: Show all professional metrics
Purpose: Detailed regional investment analysis
```

## 📈 Interactive Analysis Features

### **Hover Details**
Configure hover to show:
```
- Station Name
- Investment Score (with confidence interval)
- Investment Recommendation
- Country & Region
- Professional Metrics (G/T, EIRP)
- Services Supported
- Data Quality Score
```

### **Click Actions**
Configure click to show detailed panel:
```
- Complete investment analysis
- Component scores breakdown
- Professional metrics
- Risk assessments
- Recommended actions
```

### **Search & Filter**
Enable search by:
```
- Station name
- Country
- Investment recommendation
- Service capabilities
- Score ranges
```

## 🎯 Demo Scenarios

### **Scenario 1: Global Investment Overview**
1. Start with geographic layout
2. Size by investment score
3. Color by recommendation
4. Highlight investment opportunities

### **Scenario 2: Data Quality Assessment**
1. Switch to data quality coloring
2. Show confidence intervals
3. Explain POC vs production data
4. Demonstrate improvement potential

### **Scenario 3: Technical Deep Dive**
1. Focus on specific region
2. Show professional metrics
3. Explain service capabilities
4. Discuss integration with SatOp data

### **Scenario 4: Architecture Demonstration**
1. Show node types and relationships
2. Explain graph structure
3. Demonstrate filter capabilities
4. Show production enhancement potential

## 💡 Pro Tips

### **Performance Optimization**
- Use Level-of-Detail for large datasets
- Implement progressive loading
- Cache frequently accessed configurations

### **Storytelling**
- Create saved views for key insights
- Use annotations for important findings
- Build narrative flow through configurations

### **Collaboration**
- Share specific views with stakeholders
- Export static images for reports
- Create interactive demos

## 🚀 Next Steps After Import

1. **Validate Data**: Verify all nodes and edges imported correctly
2. **Test Interactions**: Ensure filters and styling work as expected
3. **Create Views**: Save different configurations for various use cases
4. **Prepare Demo**: Practice navigation and key talking points
5. **Gather Feedback**: Use visualization to identify improvement areas

## 📞 Support

If you encounter issues:
1. Check the validation summary in `data/enhanced_validation_summary.json`
2. Refer to the production architecture diagram
3. Review the POC improvements roadmap
4. Consider the SatOps integration strategy

**Remember**: This POC demonstrates capability with synthetic/public data. Production deployment would use real operator data for 95%+ accuracy vs current ~70% POC accuracy.