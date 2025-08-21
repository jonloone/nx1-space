import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  MetricWidget,
  InsightWidget,
  DataGridWidget,
  MiniChartWidget,
  StatusWidget,
  WidgetRenderer
} from '@/components/Templates/widgets';

describe('Template Widgets', () => {
  describe('MetricWidget', () => {
    it('should render metric value correctly', () => {
      const props = {
        id: 'test-metric',
        title: 'Revenue',
        data: {
          value: 50000,
          change: 15,
          subtitle: 'Last 30 days'
        }
      };
      
      render(<MetricWidget {...props} />);
      
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('50,000')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    });
    
    it('should format currency values correctly', () => {
      const props = {
        id: 'test-currency',
        title: 'Total Sales',
        data: { value: 1234567 },
        config: { format: 'currency' }
      };
      
      render(<MetricWidget {...props} />);
      
      expect(screen.getByText('$1,234,567')).toBeInTheDocument();
    });
    
    it('should format percentage values correctly', () => {
      const props = {
        id: 'test-percentage',
        title: 'Utilization',
        data: { value: 85.5 },
        config: { format: 'percentage' }
      };
      
      render(<MetricWidget {...props} />);
      
      expect(screen.getByText('85.5%')).toBeInTheDocument();
    });
    
    it('should format compact numbers correctly', () => {
      const props = {
        id: 'test-compact',
        title: 'Users',
        data: { value: 2500000 },
        config: { format: 'compact' }
      };
      
      render(<MetricWidget {...props} />);
      
      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });
    
    it('should show units when provided', () => {
      const props = {
        id: 'test-units',
        title: 'Temperature',
        data: { value: 25 },
        config: { unit: '°C' }
      };
      
      render(<MetricWidget {...props} />);
      
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('°C')).toBeInTheDocument();
    });
  });
  
  describe('InsightWidget', () => {
    it('should render insight with correct type', () => {
      const props = {
        id: 'test-insight',
        title: 'Performance Alert',
        data: {
          type: 'warning',
          message: 'CPU usage is high',
          confidence: 75
        }
      };
      
      render(<InsightWidget {...props} />);
      
      expect(screen.getByText('Performance Alert')).toBeInTheDocument();
      expect(screen.getByText('CPU usage is high')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
    
    it('should apply correct border color based on type', () => {
      const warningProps = {
        id: 'warning-insight',
        title: 'Warning',
        data: { type: 'warning', message: 'Test warning' }
      };
      
      const { container: warningContainer } = render(<InsightWidget {...warningProps} />);
      const warningDiv = warningContainer.firstChild as HTMLElement;
      expect(warningDiv).toHaveClass('border-yellow-400/30');
      
      const successProps = {
        id: 'success-insight',
        title: 'Success',
        data: { type: 'success', message: 'Test success' }
      };
      
      const { container: successContainer } = render(<InsightWidget {...successProps} />);
      const successDiv = successContainer.firstChild as HTMLElement;
      expect(successDiv).toHaveClass('border-green-400/30');
    });
  });
  
  describe('DataGridWidget', () => {
    const mockData = {
      rows: [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
        { id: 3, name: 'Item 3', value: 150 }
      ]
    };
    
    const mockConfig = {
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'value', label: 'Value' }
      ],
      sortable: true
    };
    
    it('should render data grid with columns and rows', () => {
      const props = {
        id: 'test-grid',
        title: 'Test Grid',
        data: mockData,
        config: mockConfig
      };
      
      render(<DataGridWidget {...props} />);
      
      expect(screen.getByText('Test Grid')).toBeInTheDocument();
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('200')).toBeInTheDocument();
    });
    
    it('should handle sorting when sortable is true', () => {
      const props = {
        id: 'test-grid',
        title: 'Test Grid',
        data: mockData,
        config: mockConfig
      };
      
      render(<DataGridWidget {...props} />);
      
      // Click on Value column to sort
      const valueHeader = screen.getByText('Value');
      fireEvent.click(valueHeader);
      
      // Check if sort indicator appears
      const sortedHeader = valueHeader.parentElement;
      expect(sortedHeader?.textContent).toContain('↑');
      
      // Click again to reverse sort
      fireEvent.click(valueHeader);
      expect(sortedHeader?.textContent).toContain('↓');
    });
    
    it('should call onInteraction when row is clicked', () => {
      const mockInteraction = jest.fn();
      const props = {
        id: 'test-grid',
        title: 'Test Grid',
        data: mockData,
        config: mockConfig,
        onInteraction: mockInteraction
      };
      
      render(<DataGridWidget {...props} />);
      
      const firstRow = screen.getByText('Item 1').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
        expect(mockInteraction).toHaveBeenCalledWith('row-click', mockData.rows[0]);
      }
    });
    
    it('should show empty state when no data', () => {
      const props = {
        id: 'test-grid',
        title: 'Empty Grid',
        data: { rows: [] },
        config: mockConfig
      };
      
      render(<DataGridWidget {...props} />);
      
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });
  
  describe('StatusWidget', () => {
    it('should render status with correct color', () => {
      const activeProps = {
        id: 'active-status',
        title: '',
        data: { status: 'active', label: 'System Active' }
      };
      
      const { container: activeContainer } = render(<StatusWidget {...activeProps} />);
      expect(screen.getByText('System Active')).toBeInTheDocument();
      const activeDot = activeContainer.querySelector('.bg-green-400');
      expect(activeDot).toBeInTheDocument();
      
      const errorProps = {
        id: 'error-status',
        title: '',
        data: { status: 'error', label: 'System Error' }
      };
      
      const { container: errorContainer } = render(<StatusWidget {...errorProps} />);
      expect(screen.getByText('System Error')).toBeInTheDocument();
      const errorDot = errorContainer.querySelector('.bg-red-400');
      expect(errorDot).toBeInTheDocument();
    });
  });
  
  describe('MiniChartWidget', () => {
    it('should render chart with SVG path', () => {
      const props = {
        id: 'test-chart',
        title: 'Performance',
        data: {
          points: [10, 20, 15, 30, 25, 35],
          currentValue: 35
        },
        config: {
          color: '#3b82f6',
          height: 60
        }
      };
      
      render(<MiniChartWidget {...props} />);
      
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      
      const path = svg?.querySelector('path');
      expect(path).toBeInTheDocument();
    });
  });
  
  describe('WidgetRenderer', () => {
    it('should render correct widget based on type', () => {
      const metricProps = {
        type: 'metric',
        props: {
          id: 'test',
          title: 'Test Metric',
          data: { value: 100 }
        }
      };
      
      render(<WidgetRenderer {...metricProps} />);
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
    
    it('should show error for unknown widget type', () => {
      const unknownProps = {
        type: 'unknown-widget',
        props: {
          id: 'test',
          title: 'Test',
          data: {}
        }
      };
      
      render(<WidgetRenderer {...unknownProps} />);
      expect(screen.getByText('Unknown widget type: unknown-widget')).toBeInTheDocument();
    });
  });
});