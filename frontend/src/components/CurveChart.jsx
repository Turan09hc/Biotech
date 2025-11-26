import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-lg">
        <p className="text-text-secondary text-xs mb-2">
          {`Temperature: ${label?.toFixed(1)}°C`}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
            {`${entry.name}: ${entry.value?.toFixed(4)}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function CurveChart({
  data,
  tm,
  adjustedTm,
  title = "DSF Thermal Transition Curve",
  showAdjusted = false,
  showDerivative = true,
  height = 400,
}) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-96 bg-dark-card rounded-lg border border-dark-border flex items-center justify-center">
        <p className="text-text-secondary">No data available</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 60, left: 0, bottom: 20 }}
        >
          <defs>
            <linearGradient id="derivativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1F2633"
            vertical={true}
            opacity={0.5}
          />

          <XAxis
            dataKey="temperature"
            label={{
              value: 'Temperature (°C)',
              position: 'insideBottomRight',
              offset: -10,
              fill: '#9199A8',
              fontSize: 12,
            }}
            stroke="#9199A8"
            tick={{ fontSize: 12, fill: '#9199A8' }}
            domain={[15, 100]}
            type="number"
          />

          <YAxis
            yAxisId="left"
            label={{
              value: 'F350/F330 Ratio',
              angle: -90,
              position: 'insideLeft',
              fill: '#9199A8',
              offset: 10,
            }}
            stroke="#9199A8"
            tick={{ fontSize: 12, fill: '#9199A8' }}
            domain={[0.35, 0.85]}
          />

          {showDerivative && (
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{
                value: 'dRatio/dT',
                angle: 90,
                position: 'insideRight',
                fill: '#9199A8',
                offset: 10,
              }}
              stroke="#9199A8"
              tick={{ fontSize: 12, fill: '#9199A8' }}
            />
          )}

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            verticalAlign="top"
            textColor="#E8EAEE"
          />

          {/* Raw Ratio */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rawRatio"
            stroke="#06B6D4"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
            opacity={0.7}
            name="Raw Ratio"
          />

          {/* Smoothed Ratio */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="smoothedRatio"
            stroke="#06B6D4"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
            opacity={1}
            name="Smoothed Ratio"
          />

          {/* Adjusted Ratio */}
          {showAdjusted && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="adjustedRatio"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
              opacity={0.8}
              name="Adjusted Ratio"
            />
          )}

          {/* Derivative - Area with outline */}
          {showDerivative && (
            <>
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="derivative"
                fill="url(#derivativeGradient)"
                stroke="#EF4444"
                strokeWidth={0}
                isAnimationActive={true}
                animationDuration={800}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="derivative"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
                name="dRatio/dT"
              />
            </>
          )}

          {/* Tm Reference Lines */}
          {tm && (
            <ReferenceLine
              x={tm}
              yAxisId="left"
              stroke="#10B981"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{
                value: `Tm: ${tm.toFixed(1)}°C`,
                position: 'top',
                fill: '#10B981',
                fontSize: 12,
                fontWeight: 600,
                offset: 10,
              }}
            />
          )}

          {/* Adjusted Tm Reference Line */}
          {showAdjusted && adjustedTm && (
            <ReferenceLine
              x={adjustedTm}
              yAxisId="left"
              stroke="#F59E0B"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{
                value: `Adjusted Tm: ${adjustedTm.toFixed(1)}°C`,
                position: 'bottom',
                fill: '#F59E0B',
                fontSize: 12,
                fontWeight: 600,
                offset: 10,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}