export const chartTheme = {
    color: [
        '#a855f7', // purple-500 (Primary)
        '#3b82f6', // blue-500
        '#ef4444', // red-500
        '#f59e0b', // amber-500
        '#10b981', // emerald-500
        '#6366f1', // indigo-500
        '#ec4899', // pink-500
    ],
    backgroundColor: 'rgba(0, 0, 0, 0)',
    textStyle: {
        fontFamily: 'Inter, system-ui, sans-serif',
    },
    title: {
        textStyle: {
            color: '#e4e4e7', // zinc-200
            fontSize: 16,
            fontWeight: 600,
        },
    },
    tooltip: {
        backgroundColor: '#18181b', // zinc-900
        borderColor: '#27272a', // zinc-800
        textStyle: {
            color: '#e4e4e7', // zinc-200
        },
        padding: 12,
        extraCssText: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); border-radius: 8px;',
    },
    legend: {
        textStyle: {
            color: '#a1a1aa', // zinc-400
        },
        pageTextStyle: {
            color: '#a1a1aa',
        },
    },
    grid: {
        containLabel: true,
        top: 40,
        bottom: 20,
        left: 20,
        right: 20,
    },
    categoryAxis: {
        axisLine: {
            show: false,
            lineStyle: {
                color: '#52525b', // zinc-600
            },
        },
        axisTick: {
            show: false,
        },
        axisLabel: {
            color: '#a1a1aa', // zinc-400
            fontSize: 12,
        },
        splitLine: {
            show: false,
        },
    },
    valueAxis: {
        axisLine: {
            show: false,
        },
        axisTick: {
            show: false,
        },
        axisLabel: {
            color: '#a1a1aa', // zinc-400
            fontSize: 12,
        },
        splitLine: {
            show: true,
            lineStyle: {
                color: '#27272a', // zinc-800
                type: 'dashed',
            },
        },
    },
};
