import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartTheme } from './ChartTheme';
import * as echarts from 'echarts';

interface LazyChartProps {
    option: any;
    height?: string | number;
    className?: string;
    loading?: boolean;
}

echarts.registerTheme('zinc-dark', chartTheme);

const LazyChart: React.FC<LazyChartProps> = ({ option, height = '300px', className, loading = false }) => {
    return (
        <div className={className} style={{ height, width: '100%' }}>
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                theme="zinc-dark"
                showLoading={loading}
                loadingOption={{
                    text: '',
                    color: '#a855f7',
                    textColor: '#e4e4e7',
                    maskColor: 'rgba(0, 0, 0, 0.1)',
                    zlevel: 0,
                }}
            />
        </div>
    );
};

export default LazyChart;
