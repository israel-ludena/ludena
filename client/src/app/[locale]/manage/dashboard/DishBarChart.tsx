"use client";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { DashboardIndicatorResType } from "@/schemaValidations/indicator.schema";
import { useTranslations } from "next-intl";

const colors = [
  "var(--color-chrome)",
  "var(--color-safari)",
  "var(--color-firefox)",
  "var(--color-edge)",
  "var(--color-other)",
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "var(--chart-1)",
  },
  safari: {
    label: "Safari",
    color: "var(--chart-2)",
  },
  firefox: {
    label: "Firefox",
    color: "var(--chart-3)",
  },
  edge: {
    label: "Edge",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function DishBarChart({
  chartData,
}: {
  chartData: Pick<DashboardIndicatorResType["data"]["dishIndicator"][0], "name" | "successOrders">[];
}) {
  const t = useTranslations("DishBarChart");
  const chartDateColors = chartData.map((data, index) => {
    return {
      ...data,
      fill: colors[index] ?? colors[colors.length - 1],
    };
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dishRanking")}</CardTitle>
        <CardDescription>{t("mostOrdered")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartDateColors}
            layout='vertical'
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey='name'
              type='category'
              tickLine={false}
              tickMargin={2}
              axisLine={false}
              tickFormatter={(value) => {
                return value;
              }}
            />
            <XAxis dataKey='successOrders' type='number' hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey='successOrders' name={t("paidOrders")} radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
