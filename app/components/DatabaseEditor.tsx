"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { EditorView } from "codemirror";
import { sql } from "@codemirror/lang-sql";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab } from "@codemirror/commands";
import {
  autocompletion,
  startCompletion,
  CompletionContext,
} from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { Braces, TableIcon } from "lucide-react";

interface PowerRanger {
  id: number;
  user: string;
  ranger_color: string;
  zord: string;
  weapon: string;
  season: string;
  joined_date: string;
  status: string;
  power_level: number;
  location: string;
}

interface PowerRangersData {
  tableName: string;
  data: PowerRanger[];
  columns: Array<{
    name: string;
    type: string;
    notNull: boolean;
  }>;
}

interface DescribeResult {
  field: string;
  type: string;
  null: string;
}

interface ShowTablesResult {
  table_name: string;
}

type QueryResult =
  | Partial<PowerRanger>
  | DescribeResult
  | ShowTablesResult
  | { count: number }
  | { sum: number }
  | { max: number }
  | { min: number }
  | { avg: number };

export const powerRangersData: PowerRangersData = {
  tableName: "power_rangers",
  data: [
    {
      id: 1,
      user: "Jason Lee Scott",
      ranger_color: "Red",
      zord: "Tyrannosaurus",
      weapon: "Power Sword",
      season: "Mighty Morphin",
      joined_date: "1993-08-28",
      status: "Active",
      power_level: 90.24321,
      location: "Angel Grove",
    },
    {
      id: 2,
      user: "Trini Kwan",
      ranger_color: "Yellow",
      zord: "Saber-Toothed Tiger",
      weapon: "Power Daggers",
      season: "Mighty Morphin",
      joined_date: "1993-08-28",
      status: "Active",
      power_level: 85.4754,
      location: "Angel Grove",
    },
    {
      id: 3,
      user: "Billy Cranston",
      ranger_color: "Blue",
      zord: "Triceratops",
      weapon: "Power Lance",
      season: "Mighty Morphin",
      joined_date: "1993-08-28",
      status: "Active",
      power_level: 80.24,
      location: "Angel Grove",
    },
    {
      id: 4,
      user: "Kimberly Hart",
      ranger_color: "Pink",
      zord: "Pterodactyl",
      weapon: "Power Bow",
      season: "Mighty Morphin",
      joined_date: "1993-08-28",
      status: "Active",
      power_level: 88,
      location: "Angel Grove",
    },
    {
      id: 5,
      user: "Zack Taylor",
      ranger_color: "Black",
      zord: "Mastodon",
      weapon: "Power Axe",
      season: "Mighty Morphin",
      joined_date: "1993-08-28",
      status: "Active",
      power_level: 82,
      location: "Angel Grove",
    },
    {
      id: 6,
      user: "Tommy Oliver",
      ranger_color: "Green",
      zord: "Dragonzord",
      weapon: "Dragon Dagger",
      season: "Mighty Morphin",
      joined_date: "1993-10-10",
      status: "Active",
      power_level: 95,
      location: "Angel Grove",
    },
    {
      id: 7,
      user: "Tommy Oliver",
      ranger_color: "White",
      zord: "White Tigerzord",
      weapon: "Saba",
      season: "Mighty Morphin",
      joined_date: "1994-01-10",
      status: "Active",
      power_level: 97,
      location: "Angel Grove",
    },
  ],
  columns: [
    { name: "id", type: "integer", notNull: true },
    { name: "user", type: "text", notNull: true },
    { name: "ranger_color", type: "text", notNull: true },
    { name: "zord", type: "text", notNull: true },
    { name: "weapon", type: "text", notNull: true },
    { name: "season", type: "text", notNull: true },
    { name: "joined_date", type: "date", notNull: true },
    { name: "status", type: "text", notNull: true },
    { name: "power_level", type: "integer", notNull: true },
    { name: "location", type: "text", notNull: true },
  ],
};

interface ViewToggleProps {
  onViewModeChange?: (mode: "json" | "table") => void;
}

function ViewToggle({ onViewModeChange }: ViewToggleProps) {
  const [viewMode, setViewMode] = useState<"json" | "table">("json");

  const handleModeChange = (mode: "json" | "table") => {
    setViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleModeChange("json")}
        className={`px-3 py-2 rounded-l-md bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
          viewMode === "json" ? "border-green-500" : ""
        }`}
      >
        <Braces className="w-4 h-4 mr-2 inline-block" />
        JSON
      </button>
      <button
        onClick={() => handleModeChange("table")}
        className={`px-3 py-2 rounded-r-md bg-slate-800 border-slate-700 border text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
          viewMode === "table" ? "border-green-500" : ""
        }`}
      >
        <TableIcon className="w-4 h-4 mr-2 inline-block" />
        Table
      </button>
    </div>
  );
}

interface TooltipProps {
  message: string;
}

function Tooltip({ message }: TooltipProps) {
  return (
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-2 bg-gray-700 text-white text-xs rounded-md px-3 py-1.5 shadow-lg animate-in fade-in slide-in-from-top-2">
      {message}
    </div>
  );
}

export default function SqlEditor() {
  const editorRef = useRef<EditorView | null>(null);
  const [result, setResult] = useState<string | null>("");
  const [viewMode, setViewMode] = useState<"json" | "table">("json");
  const [tooltip, setTooltip] = useState<string | null>("");

  const uniqueSeasons = Array.from(
    new Set(powerRangersData.data.map((row) => row.season))
  ).sort();

  const formatColumnName = (columnName: string): string => {
    return columnName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const evaluateLikeCondition = (
    columnValue: string | number,
    pattern: string
  ): boolean => {
    const cleanPattern = pattern.replace(/^'|'$/g, "");
    const regexPattern = cleanPattern
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/%/g, ".*")
      .replace(/_/g, ".");
    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(String(columnValue));
  };

  const evaluateBetweenCondition = (
    row: PowerRanger,
    column: string,
    value1: string,
    value2: string
  ): boolean => {
    const columnValue = row[column as keyof PowerRanger];
    const columnType = powerRangersData.columns.find(
      (col) => col.name === column
    )?.type;

    const cleanValue1 = value1.replace(/^'|'$/g, "");
    const cleanValue2 = value2.replace(/^'|'$/g, "");

    let typedColumnValue: string | number;
    let typedValue1: string | number;
    let typedValue2: string | number;

    if (columnType === "integer") {
      typedColumnValue = Number(columnValue);
      typedValue1 = Number(cleanValue1);
      typedValue2 = Number(cleanValue2);
      if (isNaN(typedColumnValue) || isNaN(typedValue1) || isNaN(typedValue2)) {
        return false;
      }
      return typedColumnValue >= typedValue1 && typedColumnValue <= typedValue2;
    } else if (columnType === "date" || columnType === "text") {
      typedColumnValue = String(columnValue);
      typedValue1 = cleanValue1;
      typedValue2 = cleanValue2;
      return typedColumnValue >= typedValue1 && typedColumnValue <= typedValue2;
    }

    return false;
  };

  const evaluateCondition = (
    row: PowerRanger,
    column: string,
    operator: string,
    value: string
  ): boolean => {
    const columnValue = row[column as keyof PowerRanger];
    const columnType = powerRangersData.columns.find(
      (col) => col.name === column
    )?.type;

    if (operator.toUpperCase() === "LIKE") {
      return evaluateLikeCondition(columnValue, value);
    }

    const cleanValue = value.replace(/^'|'$/g, "");
    let typedColumnValue: string | number;
    let typedValue: string | number;

    if (columnType === "integer") {
      typedColumnValue = Number(columnValue);
      typedValue = Number(cleanValue);
      if (isNaN(typedColumnValue) || isNaN(typedValue)) {
        return false;
      }
    } else if (columnType === "date" || columnType === "text") {
      typedColumnValue = String(columnValue);
      typedValue = cleanValue;
    } else {
      return false;
    }

    switch (operator.toUpperCase()) {
      case "=":
        return typedColumnValue === typedValue;
      case "!=":
        return typedColumnValue !== typedValue;
      case ">":
        return typedColumnValue > typedValue;
      case "<":
        return typedColumnValue < typedValue;
      case ">=":
        return typedColumnValue >= typedValue;
      case "<=":
        return typedColumnValue <= typedValue;
      default:
        return false;
    }
  };

  const evaluateNullCondition = (
    row: PowerRanger,
    column: string,
    operator: string
  ): boolean => {
    const columnValue = row[column as keyof PowerRanger];
    if (operator.toUpperCase() === "IS NULL") {
      return columnValue === null || columnValue === undefined;
    }
    if (operator.toUpperCase() === "IS NOT NULL") {
      return columnValue !== null && columnValue !== undefined;
    }
    return false;
  };

  const runQuery = useCallback(
    (view: EditorView): boolean => {
      const query = view.state.doc.toString().trim();

      if (!query) {
        setResult("No query entered");
        setTooltip(null);
        return true;
      }

      const lowerQuery = query.toLowerCase();
      if (lowerQuery === "show tables") {
        const showTablesResult: ShowTablesResult[] = [
          { table_name: powerRangersData.tableName },
        ];
        setResult(JSON.stringify(showTablesResult, null, 2));
        setTooltip(null);
        return true;
      }

      if (lowerQuery === "describe power_rangers") {
        const describeResult: DescribeResult[] = powerRangersData.columns.map(
          (col) => ({
            field: col.name,
            type: col.type,
            null: col.notNull ? "NO" : "YES",
          })
        );
        setResult(JSON.stringify(describeResult, null, 2));
        setTooltip(null);
        return true;
      }

      const sumMatch = query.match(
        /^select\s+sum\s*\((\w+)\)\s*(?:as\s+'([^']+)')?\s+from\s+power_rangers(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+limit\s+(\d+))?\s*;?$/i
      );
      const countMatch = query.match(
        /^select\s+count\s*\(([*]|\w+)\)\s*(?:as\s+'([^']+)')?\s+from\s+power_rangers(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+limit\s+(\d+))?\s*;?$/i
      );
      const maxMatch = query.match(
        /^select\s+max\s*\((\w+)\)\s*(?:as\s+'([^']+)')?\s+from\s+power_rangers(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+limit\s+(\d+))?\s*;?$/i
      );
      const minMatch = query.match(
        /^select\s+min\s*\((\w+)\)\s*(?:as\s+'([^']+)')?\s+from\s+power_rangers(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+limit\s+(\d+))?\s*;?$/i
      );
      const avgMatch = query.match(
        /^select\s+avg\s*\((\w+)\)\s*(?:as\s+'([^']+)')?\s+from\s+power_rangers(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+limit\s+(\d+))?\s*;?$/i
      );
      const roundMatch = query.match(
        /^select\s+round\s*\((\w+),\s*(\d+)\)\s*(?:as\s+'([^']+)')?\s+from\s+power_rangers(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+limit\s+(\d+))?\s*;?$/i
      );
      const groupByMatch = query.match(
        /^select\s+(.+?)\s+from\s+power_rangers(?:\s+where\s+(.+?))?(?:\s+group\s+by\s+(.+?))(?:\s+having\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+limit\s+(\d+))?\s*;?$/i
      );
      const selectDistinctMatch = query.match(
        /^select\s+distinct\s+(.+?)\s+from\s+power_rangers(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+limit\s+(\d+))?\s*;?$/i
      );
      const selectMatch = query.match(
        /^select\s+(?!distinct|count\s*\(|sum\s*\(|max\s*\(|min\s*\(|avg\s*\(|round\s*\()(.*?)\s+from\s+power_rangers(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+limit\s+(\d+))?\s*;?$/i
      );

      if (
        !selectMatch &&
        !selectDistinctMatch &&
        !countMatch &&
        !sumMatch &&
        !maxMatch &&
        !avgMatch &&
        !roundMatch &&
        !groupByMatch
      ) {
        setResult(
          "Error: Query must be 'SELECT [DISTINCT] <fields> FROM power_rangers [WHERE <condition>] [GROUP BY <fields> [HAVING <condition>]] [ORDER BY <column> [ASC|DESC]] [LIMIT <number>]', 'SELECT COUNT(*) FROM power_rangers [WHERE <condition>] [LIMIT <number>]', 'SELECT SUM(<column>) FROM power_rangers [WHERE <condition>] [LIMIT <number>]', 'SELECT MAX(<column>) FROM power_rangers [WHERE <condition>] [LIMIT <number>]', 'SELECT MIN(<column>) FROM power_rangers [WHERE <condition>] [LIMIT <number>]', 'SELECT AVG(<column>) FROM power_rangers [WHERE <condition>] [LIMIT <number>]', 'SELECT ROUND(<column>, <decimals>) FROM power_rangers [WHERE <condition>] [LIMIT <number>]', 'DESCRIBE power_rangers', or 'SHOW TABLES'"
        );
        setTooltip(null);
        return true;
      }

      if (groupByMatch) {
        const [
          ,
          rawFields,
          whereClause,
          groupByClause,
          havingClause,
          orderByColumn,
          orderByDirection = "ASC",
          limitValue,
        ] = groupByMatch;

        const rawFieldsWithAliases = rawFields
          .split(/(?<!\([^()]*),(?![^()]*\))/)
          .map((f) => f.trim())
          .filter((f) => f);
        const fields: Array<{
          name: string;
          alias?: string;
          isAggregate: boolean;
          aggregateType?: string;
          innerAggregate?: string;
          decimals?: number;
        }> = [];

        for (const field of rawFieldsWithAliases) {
          const asMatch = field.match(/^(.+?)\s+as\s+'([^']+)'\s*$/i);
          let fieldName = field;
          let alias: string | undefined;
          let isAggregate = false;
          let aggregateType: string | undefined;
          let innerAggregate: string | undefined;
          let decimals: number | undefined;

          if (asMatch) {
            fieldName = asMatch[1].trim();
            alias = asMatch[2];
          }

          const roundAvgMatch = fieldName.match(
            /^round\s*\(\s*avg\s*\((\w+)\)(?:,\s*(\d+))?\s*\)$/i
          );
          const aggregateMatch = fieldName.match(
            /^(count|sum|max|min|avg|round)\s*\((.*?)\)\s*$/i
          );

          if (roundAvgMatch) {
            isAggregate = true;
            aggregateType = "round";
            innerAggregate = "avg";
            fieldName = roundAvgMatch[1].trim(); // e.g., power_level
            decimals = roundAvgMatch[2] ? parseInt(roundAvgMatch[2], 10) : 0;
            alias = alias || "round_avg";
          } else if (aggregateMatch) {
            isAggregate = true;
            aggregateType = aggregateMatch[1].toLowerCase();
            fieldName = aggregateMatch[2].trim();
            if (aggregateType === "count" && fieldName === "*") {
              fieldName = "*";
            } else if (aggregateType === "round") {
              const roundMatch = fieldName.match(/^(\w+),\s*(\d+)$/);
              if (roundMatch) {
                fieldName = roundMatch[1];
                decimals = parseInt(roundMatch[2], 10);
              }
            }
            alias = alias || aggregateType;
          } else {
            alias = alias || fieldName;
          }

          if (
            !isAggregate ||
            (isAggregate &&
              fieldName !== "*" &&
              aggregateType !== "round" &&
              !innerAggregate)
          ) {
            if (
              !powerRangersData.columns.some(
                (col) => col.name.toLowerCase() === fieldName.toLowerCase()
              )
            ) {
              setResult(
                `Error: Invalid field in aggregate function: ${fieldName}`
              );
              setTooltip(null);
              return false;
            }
          }

          if (
            aggregateType === "round" &&
            !innerAggregate &&
            (isNaN(decimals!) || decimals! < 0)
          ) {
            setResult(
              "Error: ROUND requires a valid column and non-negative integer for decimal places"
            );
            setTooltip(null);
            return false;
          }

          fields.push({
            name: fieldName,
            alias,
            isAggregate,
            aggregateType,
            innerAggregate,
            decimals,
          });
        }

        const nonAggregateFields = fields
          .filter((f) => !f.isAggregate)
          .map((f) => f.name);
        const actualFields = nonAggregateFields.includes("*")
          ? powerRangersData.columns.map((col) => col.name)
          : nonAggregateFields;
        const invalidFields = actualFields.filter(
          (field) => !powerRangersData.columns.some((col) => col.name === field)
        );
        if (invalidFields.length > 0) {
          setResult(`Error: Invalid field(s): ${invalidFields.join(", ")}`);
          setTooltip(null);
          return false;
        }

        const groupByFieldsRaw = groupByClause
          .split(",")
          .map((f) => f.trim())
          .filter((f) => f);
        const groupByFields: string[] = groupByFieldsRaw
          .map((f) => {
            if (/^\d+$/.test(f)) {
              const index = parseInt(f, 10) - 1;
              if (index < 0 || index >= fields.length) {
                setResult(`Error: Invalid column reference in GROUP BY: ${f}`);
                setTooltip(null);
                return "";
              }
              return fields[index].name;
            }
            return f;
          })
          .filter((f) => f);

        const invalidGroupByFields = groupByFields.filter(
          (field) =>
            !powerRangersData.columns.some(
              (col) => col.name.toLowerCase() === field.toLowerCase()
            )
        );
        if (invalidGroupByFields.length > 0) {
          setResult(
            `Error: Invalid column(s) in GROUP BY: ${invalidGroupByFields.join(
              ", "
            )}`
          );
          setTooltip(null);
          return false;
        }

        const nonAggregateFieldNames = fields
          .filter((f) => !f.isAggregate)
          .map((f) => f.name.toLowerCase());
        const groupByFieldNames = groupByFields.map((f) => f.toLowerCase());
        const missingGroupByFields = nonAggregateFieldNames.filter(
          (f) => !groupByFieldNames.includes(f)
        );
        if (missingGroupByFields.length > 0) {
          setResult(
            `Error: Non-aggregated columns (${missingGroupByFields.join(
              ", "
            )}) must appear in GROUP BY`
          );
          setTooltip(null);
          return false;
        }

        let filteredData = powerRangersData.data;
        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            column: string;
            operator: string;
            value1?: string;
            value2?: string;
            join?: "AND" | "OR";
          }> = [];
          const joinOperators: string[] = [];

          for (let i = 0; i < conditionParts.length; i++) {
            if (i % 2 === 0) {
              const part = conditionParts[i].trim();
              const betweenMatch = part.match(
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*)\s+AND\s+('[^']*'|[^' ]\w*)$/i
              );
              if (betweenMatch) {
                const [, column, value1, value2] = betweenMatch;
                conditions.push({
                  column,
                  operator: "BETWEEN",
                  value1,
                  value2,
                });
              } else {
                const conditionMatch = part.match(
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*))?$/i
                );
                if (!conditionMatch) {
                  setResult(
                    `Error: Invalid condition in WHERE clause: ${part}`
                  );
                  setTooltip(null);
                  return false;
                }
                const [, column, operator, value1] = conditionMatch;
                conditions.push({ column, operator, value1 });
              }
            } else {
              joinOperators.push(conditionParts[i].toUpperCase());
            }
          }

          for (let i = 0; i < conditions.length - 1; i++) {
            conditions[i].join = joinOperators[i] as "AND" | "OR";
          }

          for (const condition of conditions) {
            const { column } = condition;
            if (
              !powerRangersData.columns.some(
                (col) => col.name.toLowerCase() === column.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid column in WHERE clause: ${column}`);
              setTooltip(null);
              return false;
            }
          }

          filteredData = filteredData.filter((row) => {
            let result = true;
            let currentGroup: Array<{
              column: string;
              operator: string;
              value1?: string;
              value2?: string;
            }> = [];
            let lastJoin: "AND" | "OR" | null = null;

            for (const condition of conditions) {
              const { column, operator, value1, value2, join } = condition;
              currentGroup.push({ column, operator, value1, value2 });

              if (
                join ||
                conditions.indexOf(condition) === conditions.length - 1
              ) {
                const groupResult = currentGroup.every((cond) => {
                  if (
                    ["IS NULL", "IS NOT NULL"].includes(
                      cond.operator.toUpperCase()
                    )
                  ) {
                    return evaluateNullCondition(
                      row,
                      cond.column,
                      cond.operator
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1
                    );
                  }
                });

                if (lastJoin === "OR") {
                  result = result || groupResult;
                } else {
                  result = result && groupResult;
                }

                currentGroup = [];
                lastJoin = join || null;
              }
            }
            return result;
          });
        }

        const groupedData: { [key: string]: PowerRanger[] } = {};
        filteredData.forEach((row) => {
          const groupKey = groupByFields
            .map((field) => row[field as keyof PowerRanger])
            .join("|");
          if (!groupedData[groupKey]) {
            groupedData[groupKey] = [];
          }
          groupedData[groupKey].push(row);
        });

        let resultData: Record<string, string | number | null>[] = [];
        for (const groupKey in groupedData) {
          const groupRows = groupedData[groupKey];
          const resultRow: Record<string, string | number | null> = {};

          const groupValues = groupKey.split("|");
          groupByFields.forEach((field, index) => {
            const alias =
              fields.find((f) => f.name.toLowerCase() === field.toLowerCase())
                ?.alias || field;
            resultRow[alias] = groupValues[index];
          });

          for (const field of fields) {
            if (field.isAggregate) {
              const column = field.name;
              let value: number | string | null = null;

              if (field.aggregateType === "count") {
                if (column === "*") {
                  value = groupRows.length;
                } else {
                  value = groupRows.filter(
                    (row) =>
                      row[column as keyof PowerRanger] !== null &&
                      row[column as keyof PowerRanger] !== undefined
                  ).length;
                }
              } else if (field.aggregateType === "sum") {
                const columnDef = powerRangersData.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (!columnDef || columnDef.type !== "integer") {
                  setResult(
                    `Error: SUM can only be applied to numeric columns: ${column}`
                  );
                  setTooltip(null);
                  return false;
                }
                value = groupRows.reduce((acc, row) => {
                  const val = Number(row[column as keyof PowerRanger]);
                  return isNaN(val) ? acc : acc + val;
                }, 0);
              } else if (field.aggregateType === "avg") {
                const columnDef = powerRangersData.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (!columnDef || columnDef.type !== "integer") {
                  setResult(
                    `Error: AVG can only be applied to numeric columns: ${column}`
                  );
                  setTooltip(null);
                  return false;
                }
                const values = groupRows
                  .map((row) => Number(row[column as keyof PowerRanger]))
                  .filter((val) => !isNaN(val));
                value =
                  values.length > 0
                    ? values.reduce((acc, val) => acc + val, 0) / values.length
                    : null;
              } else if (field.aggregateType === "max") {
                const columnDef = powerRangersData.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (
                  !columnDef ||
                  (columnDef.type !== "integer" && columnDef.type !== "date")
                ) {
                  setResult(
                    `Error: MAX can only be applied to numeric or date columns: ${column}`
                  );
                  setTooltip(null);
                  return false;
                }
                if (columnDef.type === "integer") {
                  value = groupRows.reduce((acc, row) => {
                    const val = Number(row[column as keyof PowerRanger]);
                    return isNaN(val)
                      ? acc
                      : Math.max(acc || Number.NEGATIVE_INFINITY, val);
                  }, null as number | null);
                } else {
                  value = groupRows.reduce((acc, row) => {
                    const val = String(row[column as keyof PowerRanger]);
                    return acc === null || val > acc ? val : acc;
                  }, null as string | null);
                }
              } else if (field.aggregateType === "min") {
                const columnDef = powerRangersData.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (
                  !columnDef ||
                  (columnDef.type !== "integer" && columnDef.type !== "date")
                ) {
                  setResult(
                    `Error: MIN can only be applied to numeric or date columns: ${column}`
                  );
                  setTooltip(null);
                  return false;
                }
                if (columnDef.type === "integer") {
                  value = groupRows.reduce((acc, row) => {
                    const val = Number(row[column as keyof PowerRanger]);
                    return isNaN(val)
                      ? acc
                      : Math.min(acc || Number.POSITIVE_INFINITY, val);
                  }, null as number | null);
                } else {
                  value = groupRows.reduce((acc, row) => {
                    const val = String(row[column as keyof PowerRanger]);
                    return acc === null || val < acc ? val : acc;
                  }, null as string | null);
                }
              } else if (
                field.aggregateType === "round" &&
                field.innerAggregate === "avg"
              ) {
                const columnDef = powerRangersData.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (!columnDef || columnDef.type !== "integer") {
                  setResult(
                    `Error: ROUND(AVG()) can only be applied to numeric columns: ${column}`
                  );
                  setTooltip(null);
                  return false;
                }
                const values = groupRows
                  .map((row) => Number(row[column as keyof PowerRanger]))
                  .filter((val) => !isNaN(val));
                const avg =
                  values.length > 0
                    ? values.reduce((acc, val) => acc + val, 0) / values.length
                    : null;
                if (avg === null) {
                  setResult(
                    `Error: No valid values found for ROUND(AVG(${column}))`
                  );
                  setTooltip(null);
                  return false;
                }
                value = Number(avg.toFixed(field.decimals || 0));
              } else if (field.aggregateType === "round") {
                const columnDef = powerRangersData.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (!columnDef || columnDef.type !== "integer") {
                  setResult(
                    `Error: ROUND can only be applied to numeric columns: ${column}`
                  );
                  setTooltip(null);
                  return false;
                }
                value = groupRows.reduce((acc, row) => {
                  const val = Number(row[column as keyof PowerRanger]);
                  return isNaN(val)
                    ? acc
                    : Number(val.toFixed(field.decimals || 0));
                }, null as number | null);
              }

              if (value === null && field.aggregateType !== "count") {
                setResult(
                  `Error: No valid values found for ${field.aggregateType?.toUpperCase()}(${column})`
                );
                setTooltip(null);
                return false;
              }

              resultRow[field.alias ?? field.name] = value;
            }
          }

          resultData.push(resultRow);
        }

        if (havingClause) {
          const havingMatch = havingClause.match(
            /^(count|sum|max|min|avg)\s*\(([*]|\w+)\)\s*(=|\!=|>|<|>=|<=)\s*(\d+)$/i
          );
          if (!havingMatch) {
            setResult(`Error: Invalid HAVING clause: ${havingClause}`);
            setTooltip(null);
            return false;
          }
        
          const [, aggregateType, column, operator, value] = havingMatch;
          resultData = resultData.filter((row) => {
            const field = fields.find(
              (f) =>
                f.isAggregate &&
                f.aggregateType?.toLowerCase() ===
                  aggregateType.toLowerCase() &&
                f.name.toLowerCase() === column.toLowerCase()
            );
            const aggValue = field?.alias ? row[field.alias] : undefined;
            if (aggValue === undefined) return false;
            const typedValue = Number(value);

            switch (operator.toUpperCase()) {
              case "=":
                return Number(aggValue) === typedValue;
              case "!=":
                return Number(aggValue) !== typedValue;
              case ">":
                return Number(aggValue) > typedValue;
              case "<":
                return Number(aggValue) < typedValue;
              case ">=":
                return Number(aggValue) >= typedValue;
              case "<=":
                return Number(aggValue) <= typedValue;
              default:
                return false;
            }
          });
        }

        if (orderByColumn) {
          const columnType = powerRangersData.columns.find(
            (col) => col.name.toLowerCase() === orderByColumn.toLowerCase()
          )?.type;

          resultData.sort((a, b) => {
            const aValue = a[orderByColumn] ?? "";
            const bValue = b[orderByColumn] ?? "";
            let comparison = 0;

            if (columnType === "integer") {
              const aNum = Number(aValue);
              const bNum = Number(bValue);
              comparison = aNum - bNum;
            } else {
              comparison = String(aValue).localeCompare(String(bValue));
            }

            return orderByDirection === "DESC" ? -comparison : comparison;
          });
        }

        if (limitValue !== undefined) {
          const limit = parseInt(limitValue, 10);
          if (isNaN(limit) || limit <= 0) {
            setResult("Error: LIMIT must be a positive integer");
            setTooltip(null);
            return false;
          }
          resultData = resultData.slice(0, limit);
        }

        try {
          setResult(JSON.stringify(resultData, null, 2));
        } catch {
          setResult("Error: Failed to generate valid JSON output");
          setTooltip(null);
          return false;
        }
        setTooltip(null);
        return true;
      }

      if (sumMatch) {
        if (lowerQuery.includes("group by")) {
          return false;
        }
        const [, sumColumn, alias = "sum", whereClause, limitValue] = sumMatch;
        let filteredData = powerRangersData.data;

        const columnDef = powerRangersData.columns.find(
          (col) => col.name.toLowerCase() === sumColumn.toLowerCase()
        );
        if (!columnDef) {
          setResult(`Error: Invalid column in SUM: ${sumColumn}`);
          setTooltip(null);
          return false;
        }
        if (columnDef.type !== "integer") {
          setResult(
            `Error: SUM can only be applied to numeric columns: ${sumColumn}`
          );
          setTooltip(null);
          return false;
        }

        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            column: string;
            operator: string;
            value1?: string;
            value2?: string;
            join?: "AND" | "OR";
          }> = [];
          const joinOperators: string[] = [];

          for (let i = 0; i < conditionParts.length; i++) {
            if (i % 2 === 0) {
              const part = conditionParts[i].trim();
              const betweenMatch = part.match(
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*)\s+AND\s+('[^']*'|[^' ]\w*)$/i
              );
              if (betweenMatch) {
                const [, column, value1, value2] = betweenMatch;
                conditions.push({
                  column,
                  operator: "BETWEEN",
                  value1,
                  value2,
                });
              } else {
                const conditionMatch = part.match(
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*))?$/i
                );
                if (!conditionMatch) {
                  setResult(
                    `Error: Invalid condition in WHERE clause: ${part}`
                  );
                  setTooltip(null);
                  return false;
                }
                const [, column, operator, value1] = conditionMatch;
                conditions.push({ column, operator, value1 });
              }
            } else {
              joinOperators.push(conditionParts[i].toUpperCase());
            }
          }

          for (let i = 0; i < conditions.length - 1; i++) {
            conditions[i].join = joinOperators[i] as "AND" | "OR";
          }

          for (const condition of conditions) {
            const { column } = condition;
            if (
              !powerRangersData.columns.some(
                (col) => col.name.toLowerCase() === column.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid column in WHERE clause: ${column}`);
              setTooltip(null);
              return false;
            }
          }

          filteredData = filteredData.filter((row) => {
            let result = true;
            let currentGroup: Array<{
              column: string;
              operator: string;
              value1?: string;
              value2?: string;
            }> = [];
            let lastJoin: "AND" | "OR" | null = null;

            for (const condition of conditions) {
              const { column, operator, value1, value2, join } = condition;
              currentGroup.push({ column, operator, value1, value2 });

              if (
                join ||
                conditions.indexOf(condition) === conditions.length - 1
              ) {
                const groupResult = currentGroup.every((cond) => {
                  if (
                    ["IS NULL", "IS NOT NULL"].includes(
                      cond.operator.toUpperCase()
                    )
                  ) {
                    return evaluateNullCondition(
                      row,
                      cond.column,
                      cond.operator
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1
                    );
                  }
                });

                if (lastJoin === "OR") {
                  result = result || groupResult;
                } else {
                  result = result && groupResult;
                }

                currentGroup = [];
                lastJoin = join || null;
              }
            }
            return result;
          });
        }

        const sum = filteredData.reduce((acc, row) => {
          const value = Number(row[sumColumn as keyof PowerRanger]);
          return isNaN(value) ? acc : acc + value;
        }, 0);

        const resultData = [{ [alias]: sum }];

        if (limitValue !== undefined) {
          const limit = parseInt(limitValue, 10);
          if (isNaN(limit) || limit <= 0) {
            setResult("Error: LIMIT must be a positive integer");
            setTooltip(null);
            return false;
          }
          resultData.splice(limit);
        }

        try {
          setResult(JSON.stringify(resultData, null, 2));
        } catch {
          setResult("Error: Failed to generate valid JSON output");
          setTooltip(null);
          return false;
        }
        setTooltip(null);
        return true;
      }

      if (countMatch) {
        const [, countArg, alias = "count", whereClause, limitValue] =
          countMatch;
        let filteredData = powerRangersData.data;

        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            column: string;
            operator: string;
            value1?: string;
            value2?: string;
            join?: "AND" | "OR";
          }> = [];
          const joinOperators: string[] = [];

          for (let i = 0; i < conditionParts.length; i++) {
            if (i % 2 === 0) {
              const part = conditionParts[i].trim();
              const betweenMatch = part.match(
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*)\s+AND\s+('[^']*'|[^' ]\w*)$/i
              );
              if (betweenMatch) {
                const [, column, value1, value2] = betweenMatch;
                conditions.push({
                  column,
                  operator: "BETWEEN",
                  value1,
                  value2,
                });
              } else {
                const conditionMatch = part.match(
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*))?$/i
                );
                if (!conditionMatch) {
                  setResult(
                    `Error: Invalid condition in WHERE clause: ${part}`
                  );
                  setTooltip(null);
                  return false;
                }
                const [, column, operator, value1] = conditionMatch;
                conditions.push({ column, operator, value1 });
              }
            } else {
              joinOperators.push(conditionParts[i].toUpperCase());
            }
          }

          for (let i = 0; i < conditions.length - 1; i++) {
            conditions[i].join = joinOperators[i] as "AND" | "OR";
          }

          for (const condition of conditions) {
            const { column } = condition;
            if (
              !powerRangersData.columns.some(
                (col) => col.name.toLowerCase() === column.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid column in WHERE clause: ${column}`);
              setTooltip(null);
              return false;
            }
          }

          filteredData = filteredData.filter((row) => {
            let result = true;
            let currentGroup: Array<{
              column: string;
              operator: string;
              value1?: string;
              value2?: string;
            }> = [];
            let lastJoin: "AND" | "OR" | null = null;

            for (const condition of conditions) {
              const { column, operator, value1, value2, join } = condition;
              currentGroup.push({ column, operator, value1, value2 });

              if (
                join ||
                conditions.indexOf(condition) === conditions.length - 1
              ) {
                const groupResult = currentGroup.every((cond) => {
                  if (
                    ["IS NULL", "IS NOT NULL"].includes(
                      cond.operator.toUpperCase()
                    )
                  ) {
                    return evaluateNullCondition(
                      row,
                      cond.column,
                      cond.operator
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1
                    );
                  }
                });

                if (lastJoin === "OR") {
                  result = result || groupResult;
                } else {
                  result = result && groupResult;
                }

                currentGroup = [];
                lastJoin = join || null;
              }
            }
            return result;
          });
        }

        let count: number;
        if (countArg === "*") {
          count = filteredData.length;
        } else {
          if (
            !powerRangersData.columns.some(
              (col) => col.name.toLowerCase() === countArg.toLowerCase()
            )
          ) {
            setResult(`Error: Invalid column in COUNT: ${countArg}`);
            setTooltip(null);
            return false;
          }
          count = filteredData.filter(
            (row) =>
              row[countArg as keyof PowerRanger] !== null &&
              row[countArg as keyof PowerRanger] !== undefined
          ).length;
        }

        const resultData = [{ [alias]: count }];

        if (limitValue !== undefined) {
          const limit = parseInt(limitValue, 10);
          if (isNaN(limit) || limit <= 0) {
            setResult("Error: LIMIT must be a positive integer");
            setTooltip(null);
            return false;
          }
          resultData.splice(limit);
        }

        try {
          setResult(JSON.stringify(resultData, null, 2));
        } catch {
          setResult("Error: Failed to generate valid JSON output");
          setTooltip(null);
          return false;
        }
        setTooltip(null);
        return true;
      }

      if (maxMatch) {
        const [, maxColumn, alias = "max", whereClause, limitValue] = maxMatch;
        let filteredData = powerRangersData.data;

        const columnDef = powerRangersData.columns.find(
          (col) => col.name.toLowerCase() === maxColumn.toLowerCase()
        );
        if (!columnDef) {
          setResult(`Error: Invalid column in MAX: ${maxColumn}`);
          setTooltip(null);
          return false;
        }
        if (columnDef.type !== "integer" && columnDef.type !== "date") {
          setResult(
            `Error: MAX can only be applied to numeric or date columns: ${maxColumn}`
          );
          setTooltip(null);
          return false;
        }

        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            column: string;
            operator: string;
            value1?: string;
            value2?: string;
            join?: "AND" | "OR";
          }> = [];
          const joinOperators: string[] = [];

          for (let i = 0; i < conditionParts.length; i++) {
            if (i % 2 === 0) {
              const part = conditionParts[i].trim();
              const betweenMatch = part.match(
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*)\s+AND\s+('[^']*'|[^' ]\w*)$/i
              );
              if (betweenMatch) {
                const [, column, value1, value2] = betweenMatch;
                conditions.push({
                  column,
                  operator: "BETWEEN",
                  value1,
                  value2,
                });
              } else {
                const conditionMatch = part.match(
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*))?$/i
                );
                if (!conditionMatch) {
                  setResult(
                    `Error: Invalid condition in WHERE clause: ${part}`
                  );
                  setTooltip(null);
                  return false;
                }
                const [, column, operator, value1] = conditionMatch;
                conditions.push({ column, operator, value1 });
              }
            } else {
              joinOperators.push(conditionParts[i].toUpperCase());
            }
          }

          for (let i = 0; i < conditions.length - 1; i++) {
            conditions[i].join = joinOperators[i] as "AND" | "OR";
          }

          for (const condition of conditions) {
            const { column } = condition;
            if (
              !powerRangersData.columns.some(
                (col) => col.name.toLowerCase() === column.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid column in WHERE clause: ${column}`);
              setTooltip(null);
              return false;
            }
          }

          filteredData = filteredData.filter((row) => {
            let result = true;
            let currentGroup: Array<{
              column: string;
              operator: string;
              value1?: string;
              value2?: string;
            }> = [];
            let lastJoin: "AND" | "OR" | null = null;

            for (const condition of conditions) {
              const { column, operator, value1, value2, join } = condition;
              currentGroup.push({ column, operator, value1, value2 });

              if (
                join ||
                conditions.indexOf(condition) === conditions.length - 1
              ) {
                const groupResult = currentGroup.every((cond) => {
                  if (
                    ["IS NULL", "IS NOT NULL"].includes(
                      cond.operator.toUpperCase()
                    )
                  ) {
                    return evaluateNullCondition(
                      row,
                      cond.column,
                      cond.operator
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1
                    );
                  }
                });

                if (lastJoin === "OR") {
                  result = result || groupResult;
                } else {
                  result = result && groupResult;
                }

                currentGroup = [];
                lastJoin = join || null;
              }
            }
            return result;
          });
        }

        let max: number | string | null = null;
        if (columnDef.type === "integer") {
          max = filteredData.reduce((acc, row) => {
            const value = Number(row[maxColumn as keyof PowerRanger]);
            return isNaN(value)
              ? acc
              : Math.max(acc || Number.NEGATIVE_INFINITY, value);
          }, null as number | null);
        } else if (columnDef.type === "date") {
          max = filteredData.reduce((acc, row) => {
            const value = String(row[maxColumn as keyof PowerRanger]);
            return acc === null || value > acc ? value : acc;
          }, null as string | null);
        }

        if (max === null) {
          setResult(`Error: No valid values found for MAX(${maxColumn})`);
          setTooltip(null);
          return false;
        }

        const resultData = [{ [alias]: max }];

        if (limitValue !== undefined) {
          const limit = parseInt(limitValue, 10);
          if (isNaN(limit) || limit <= 0) {
            setResult("Error: LIMIT must be a positive integer");
            setTooltip(null);
            return false;
          }
          resultData.splice(limit);
        }

        try {
          setResult(JSON.stringify(resultData, null, 2));
        } catch {
          setResult("Error: Failed to generate valid JSON output");
          setTooltip(null);
          return false;
        }
        setTooltip(null);
        return true;
      }

      if (minMatch) {
        const [, minColumn, alias = "min", whereClause, limitValue] = minMatch;
        let filteredData = powerRangersData.data;

        const columnDef = powerRangersData.columns.find(
          (col) => col.name.toLowerCase() === minColumn.toLowerCase()
        );
        if (!columnDef) {
          setResult(`Error: Invalid column in MIN: ${minColumn}`);
          setTooltip(null);
          return false;
        }
        if (columnDef.type !== "integer" && columnDef.type !== "date") {
          setResult(
            `Error: MIN can only be applied to numeric or date columns: ${minColumn}`
          );
          setTooltip(null);
          return false;
        }

        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            column: string;
            operator: string;
            value1?: string;
            value2?: string;
            join?: "AND" | "OR";
          }> = [];
          const joinOperators: string[] = [];

          for (let i = 0; i < conditionParts.length; i++) {
            if (i % 2 === 0) {
              const part = conditionParts[i].trim();
              const betweenMatch = part.match(
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*)\s+AND\s+('[^']*'|[^' ]\w*)$/i
              );
              if (betweenMatch) {
                const [, column, value1, value2] = betweenMatch;
                conditions.push({
                  column,
                  operator: "BETWEEN",
                  value1,
                  value2,
                });
              } else {
                const conditionMatch = part.match(
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*))?$/i
                );
                if (!conditionMatch) {
                  setResult(
                    `Error: Invalid condition in WHERE clause: ${part}`
                  );
                  setTooltip(null);
                  return false;
                }
                const [, column, operator, value1] = conditionMatch;
                conditions.push({ column, operator, value1 });
              }
            } else {
              joinOperators.push(conditionParts[i].toUpperCase());
            }
          }

          for (let i = 0; i < conditions.length - 1; i++) {
            conditions[i].join = joinOperators[i] as "AND" | "OR";
          }

          for (const condition of conditions) {
            const { column } = condition;
            if (
              !powerRangersData.columns.some(
                (col) => col.name.toLowerCase() === column.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid column in WHERE clause: ${column}`);
              setTooltip(null);
              return false;
            }
          }

          filteredData = filteredData.filter((row) => {
            let result = true;
            let currentGroup: Array<{
              column: string;
              operator: string;
              value1?: string;
              value2?: string;
            }> = [];
            let lastJoin: "AND" | "OR" | null = null;

            for (const condition of conditions) {
              const { column, operator, value1, value2, join } = condition;
              currentGroup.push({ column, operator, value1, value2 });

              if (
                join ||
                conditions.indexOf(condition) === conditions.length - 1
              ) {
                const groupResult = currentGroup.every((cond) => {
                  if (
                    ["IS NULL", "IS NOT NULL"].includes(
                      cond.operator.toUpperCase()
                    )
                  ) {
                    return evaluateNullCondition(
                      row,
                      cond.column,
                      cond.operator
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1
                    );
                  }
                });

                if (lastJoin === "OR") {
                  result = result || groupResult;
                } else {
                  result = result && groupResult;
                }

                currentGroup = [];
                lastJoin = join || null;
              }
            }
            return result;
          });
        }

        let min: number | string | null = null;
        if (columnDef.type === "integer") {
          min = filteredData.reduce((acc, row) => {
            const value = Number(row[minColumn as keyof PowerRanger]);
            return isNaN(value)
              ? acc
              : Math.min(acc || Number.POSITIVE_INFINITY, value);
          }, null as number | null);
        } else if (columnDef.type === "date") {
          min = filteredData.reduce((acc, row) => {
            const value = String(row[minColumn as keyof PowerRanger]);
            return acc === null || value < acc ? value : acc;
          }, null as string | null);
        }

        if (min === null) {
          setResult(`Error: No valid values found for MIN(${minColumn})`);
          setTooltip(null);
          return false;
        }

        const resultData = [{ [alias]: min }];

        if (limitValue !== undefined) {
          const limit = parseInt(limitValue, 10);
          if (isNaN(limit) || limit <= 0) {
            setResult("Error: LIMIT must be a positive integer");
            setTooltip(null);
            return false;
          }
          resultData.splice(limit);
        }

        try {
          setResult(JSON.stringify(resultData, null, 2));
        } catch {
          setResult("Error: Failed to generate valid JSON output");
          setTooltip(null);
          return false;
        }
        setTooltip(null);
        return true;
      }

      if (avgMatch) {
        const [, avgColumn, alias = "avg", whereClause, limitValue] = avgMatch;
        let filteredData = powerRangersData.data;

        const columnDef = powerRangersData.columns.find(
          (col) => col.name.toLowerCase() === avgColumn.toLowerCase()
        );
        if (!columnDef) {
          setResult(`Error: Invalid column in AVG: ${avgColumn}`);
          setTooltip(null);
          return false;
        }
        if (columnDef.type !== "integer") {
          setResult(
            `Error: AVG can only be applied to numeric columns: ${avgColumn}`
          );
          setTooltip(null);
          return false;
        }

        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            column: string;
            operator: string;
            value1?: string;
            value2?: string;
            join?: "AND" | "OR";
          }> = [];
          const joinOperators: string[] = [];

          for (let i = 0; i < conditionParts.length; i++) {
            if (i % 2 === 0) {
              const part = conditionParts[i].trim();
              const betweenMatch = part.match(
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*)\s+AND\s+('[^']*'|[^' ]\w*)$/i
              );
              if (betweenMatch) {
                const [, column, value1, value2] = betweenMatch;
                conditions.push({
                  column,
                  operator: "BETWEEN",
                  value1,
                  value2,
                });
              } else {
                const conditionMatch = part.match(
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*))?$/i
                );
                if (!conditionMatch) {
                  setResult(
                    `Error: Invalid condition in WHERE clause: ${part}`
                  );
                  setTooltip(null);
                  return false;
                }
                const [, column, operator, value1] = conditionMatch;
                conditions.push({ column, operator, value1 });
              }
            } else {
              joinOperators.push(conditionParts[i].toUpperCase());
            }
          }

          for (let i = 0; i < conditions.length - 1; i++) {
            conditions[i].join = joinOperators[i] as "AND" | "OR";
          }

          for (const condition of conditions) {
            const { column } = condition;
            if (
              !powerRangersData.columns.some(
                (col) => col.name.toLowerCase() === column.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid column in WHERE clause: ${column}`);
              setTooltip(null);
              return false;
            }
          }

          filteredData = filteredData.filter((row) => {
            let result = true;
            let currentGroup: Array<{
              column: string;
              operator: string;
              value1?: string;
              value2?: string;
            }> = [];
            let lastJoin: "AND" | "OR" | null = null;

            for (const condition of conditions) {
              const { column, operator, value1, value2, join } = condition;
              currentGroup.push({ column, operator, value1, value2 });

              if (
                join ||
                conditions.indexOf(condition) === conditions.length - 1
              ) {
                const groupResult = currentGroup.every((cond) => {
                  if (
                    ["IS NULL", "IS NOT NULL"].includes(
                      cond.operator.toUpperCase()
                    )
                  ) {
                    return evaluateNullCondition(
                      row,
                      cond.column,
                      cond.operator
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1
                    );
                  }
                });

                if (lastJoin === "OR") {
                  result = result || groupResult;
                } else {
                  result = result && groupResult;
                }

                currentGroup = [];
                lastJoin = join || null;
              }
            }
            return result;
          });
        }

        const values = filteredData
          .map((row) => Number(row[avgColumn as keyof PowerRanger]))
          .filter((value) => !isNaN(value));
        const avg =
          values.length > 0
            ? values.reduce((acc, val) => acc + val, 0) / values.length
            : null;

        if (avg === null) {
          setResult(`Error: No valid values found for AVG(${avgColumn})`);
          setTooltip(null);
          return false;
        }

        const resultData = [{ [alias]: avg }];

        if (limitValue !== undefined) {
          const limit = parseInt(limitValue, 10);
          if (isNaN(limit) || limit <= 0) {
            setResult("Error: LIMIT must be a positive integer");
            setTooltip(null);
            return false;
          }
          resultData.splice(limit);
        }

        try {
          setResult(JSON.stringify(resultData, null, 2));
        } catch {
          setResult("Error: Failed to generate valid JSON output");
          setTooltip(null);
          return false;
        }
        setTooltip(null);
        return true;
      }

      if (roundMatch) {
        const [
          ,
          roundColumn,
          decimalStr,
          alias = "round",
          whereClause,
          limitValue,
        ] = roundMatch;
        let filteredData = powerRangersData.data;
        const columnDef = powerRangersData.columns.find(
          (col) => col.name.toLowerCase() === roundColumn.toLowerCase()
        );
        if (!columnDef) {
          setResult(`Error: Invalid column in ROUND: ${roundColumn}`);
          setTooltip(null);
          return false;
        }
        if (columnDef.type !== "integer") {
          setResult(
            `Error: ROUND can only be applied to numeric columns: ${roundColumn}`
          );
          setTooltip(null);
          return false;
        }
        const decimalPlaces = parseInt(decimalStr, 10);
        if (isNaN(decimalPlaces) || decimalPlaces < 0) {
          setResult(
            "Error: ROUND requires a non-negative integer for decimal places"
          );
          setTooltip(null);
          return false;
        }

        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            column: string;
            operator: string;
            value1?: string;
            value2?: string;
            join?: "AND" | "OR";
          }> = [];
          const joinOperators: string[] = [];

          for (let i = 0; i < conditionParts.length; i++) {
            if (i % 2 === 0) {
              const part = conditionParts[i].trim();
              const betweenMatch = part.match(
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*)\s+AND\s+('[^']*'|[^' ]\w*)$/i
              );
              if (betweenMatch) {
                const [, column, value1, value2] = betweenMatch;
                conditions.push({
                  column,
                  operator: "BETWEEN",
                  value1,
                  value2,
                });
              } else {
                const conditionMatch = part.match(
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*))?$/i
                );
                if (!conditionMatch) {
                  setResult(
                    `Error: Invalid condition in WHERE clause: ${part}`
                  );
                  setTooltip(null);
                  return false;
                }
                const [, column, operator, value1] = conditionMatch;
                conditions.push({ column, operator, value1 });
              }
            } else {
              joinOperators.push(conditionParts[i].toUpperCase());
            }
          }

          for (let i = 0; i < conditions.length - 1; i++) {
            conditions[i].join = joinOperators[i] as "AND" | "OR";
          }

          for (const condition of conditions) {
            const { column } = condition;
            if (
              !powerRangersData.columns.some(
                (col) => col.name.toLowerCase() === column.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid column in WHERE clause: ${column}`);
              setTooltip(null);
              return false;
            }
          }

          filteredData = filteredData.filter((row) => {
            let result = true;
            let currentGroup: Array<{
              column: string;
              operator: string;
              value1?: string;
              value2?: string;
            }> = [];
            let lastJoin: "AND" | "OR" | null = null;

            for (const condition of conditions) {
              const { column, operator, value1, value2, join } = condition;
              currentGroup.push({ column, operator, value1, value2 });

              if (
                join ||
                conditions.indexOf(condition) === conditions.length - 1
              ) {
                const groupResult = currentGroup.every((cond) => {
                  if (
                    ["IS NULL", "IS NOT NULL"].includes(
                      cond.operator.toUpperCase()
                    )
                  ) {
                    return evaluateNullCondition(
                      row,
                      cond.column,
                      cond.operator
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1
                    );
                  }
                });

                if (lastJoin === "OR") {
                  result = result || groupResult;
                } else {
                  result = result && groupResult;
                }

                currentGroup = [];
                lastJoin = join || null;
              }
            }
            return result;
          });
        }

        if (isNaN(decimalPlaces) || decimalPlaces < 0) {
          setResult(
            "Error: ROUND requires a non-negative integer for decimal places"
          );
          setTooltip(null);
          return false;
        }

        const resultData = filteredData.map((row) => {
          const value = Number(row[roundColumn as keyof PowerRanger]);
          if (isNaN(value)) {
            return { [alias]: null };
          }
          return { [alias]: Number(value.toFixed(decimalPlaces)) };
        });

        if (limitValue !== undefined) {
          const limit = parseInt(limitValue, 10);
          if (isNaN(limit) || limit <= 0) {
            setResult("Error: LIMIT must be a positive integer");
            setTooltip(null);
            return false;
          }
          resultData.splice(limit);
        }

        try {
          setResult(JSON.stringify(resultData, null, 2));
        } catch {
          setResult("Error: Failed to generate valid JSON output");
          setTooltip(null);
          return false;
        }

        setTooltip(null);
        return true;
      }

      if (selectMatch || selectDistinctMatch) {
        const isDistinct = !!selectDistinctMatch;
        const match = selectDistinctMatch || selectMatch;
        if (!match || !match[1]) {
          setResult("Error: Invalid SELECT query format");
          setTooltip(null);
          return false;
        }

        const rawFieldsWithAliases = match[1].split(",").map((f) => f.trim());
        const whereClause = match[2]?.trim();
        const orderByColumn = match[3];
        const orderByDirection = match[4]?.toUpperCase() || "ASC";
        const limitValue = match[5] ? parseInt(match[5], 10) : undefined;

        if (
          limitValue !== undefined &&
          (isNaN(limitValue) || limitValue <= 0)
        ) {
          setResult("Error: LIMIT must be a positive integer");
          setTooltip(null);
          return false;
        }

        const fields: string[] = [];
        const aliases: { [key in keyof PowerRanger]?: string } = {};

        for (const field of rawFieldsWithAliases) {
          const asMatch = field.match(/^(.+?)\s+as\s+'([^']+)'\s*$/i);
          if (asMatch) {
            const fieldName = asMatch[1].trim();
            const aliasName = asMatch[2];
            fields.push(fieldName);
            aliases[fieldName as keyof PowerRanger] = aliasName;
          } else {
            fields.push(field);
          }
        }

        const uniqueFields = new Set(fields);
        if (uniqueFields.size !== fields.length) {
          setResult("Error: Duplicate field names are not allowed");
          setTooltip(null);
          return false;
        }

        if (fields.includes("*") && fields.length > 1) {
          setResult("Error: Cannot mix * with specific fields");
          setTooltip(null);
          return false;
        }

        const actualFields = fields.includes("*")
          ? powerRangersData.columns.map((col) => col.name)
          : fields;

        const invalidFields = actualFields.filter(
          (field) => !powerRangersData.columns.some((col) => col.name === field)
        );
        if (invalidFields.length > 0) {
          setResult(`Error: Invalid field(s): ${invalidFields.join(", ")}`);
          setTooltip(null);
          return false;
        }

        let filteredData: PowerRanger[] = powerRangersData.data;

        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            column: string;
            operator: string;
            value1?: string;
            value2?: string;
            join?: "AND" | "OR";
          }> = [];
          const joinOperators: string[] = [];

          for (let i = 0; i < conditionParts.length; i++) {
            if (i % 2 === 0) {
              const part = conditionParts[i].trim();
              const betweenMatch = part.match(
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*)\s+AND\s+('[^']*'|[^' ]\w*)$/i
              );
              if (betweenMatch) {
                const [, column, value1, value2] = betweenMatch;
                conditions.push({
                  column,
                  operator: "BETWEEN",
                  value1,
                  value2,
                });
              } else {
                const conditionMatch = part.match(
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*))?$/i
                );
                if (!conditionMatch) {
                  setResult(
                    `Error: Invalid condition in WHERE clause: ${part}`
                  );
                  setTooltip(null);
                  return false;
                }
                const [, column, operator, value1] = conditionMatch;
                conditions.push({ column, operator, value1 });
              }
            } else {
              joinOperators.push(conditionParts[i].toUpperCase());
            }
          }

          for (let i = 0; i < conditions.length - 1; i++) {
            conditions[i].join = joinOperators[i] as "AND" | "OR";
          }

          for (const condition of conditions) {
            const { column } = condition;
            if (
              !powerRangersData.columns.some(
                (col) => col.name.toLowerCase() === column.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid column in WHERE clause: ${column}`);
              setTooltip(null);
              return false;
            }
          }

          filteredData = filteredData.filter((row) => {
            let result = true;
            let currentGroup: Array<{
              column: string;
              operator: string;
              value1?: string;
              value2?: string;
            }> = [];
            let lastJoin: "AND" | "OR" | null = null;

            for (const condition of conditions) {
              const { column, operator, value1, value2, join } = condition;
              currentGroup.push({ column, operator, value1, value2 });

              if (
                join ||
                conditions.indexOf(condition) === conditions.length - 1
              ) {
                const groupResult = currentGroup.every((cond) => {
                  if (
                    ["IS NULL", "IS NOT NULL"].includes(
                      cond.operator.toUpperCase()
                    )
                  ) {
                    return evaluateNullCondition(
                      row,
                      cond.column,
                      cond.operator
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1
                    );
                  }
                });

                if (lastJoin === "OR") {
                  result = result || groupResult;
                } else {
                  result = result && groupResult;
                }

                currentGroup = [];
                lastJoin = join || null;
              }
            }
            return result;
          });
        }

        let resultData: Partial<PowerRanger>[] = filteredData.map((row) =>
          Object.fromEntries(
            actualFields.map((field) => {
              const alias = aliases[field as keyof PowerRanger] || field;
              return [alias, row[field as keyof PowerRanger]];
            })
          )
        );

        if (isDistinct) {
          const distinctRows = new Set<string>();
          resultData = resultData.filter(
            (row: Record<string, string | number | undefined>) => {
              const key = actualFields
                .map((field) => {
                  const alias = aliases[field as keyof PowerRanger] || field;
                  return `${alias}:${row[alias]}`;
                })
                .join("|");
              if (distinctRows.has(key)) {
                return false;
              }
              distinctRows.add(key);
              return true;
            }
          );

          if (fields.length > 1) {
            const groupByFields = fields.map(
              (field) => aliases[field as keyof PowerRanger] || field
            );
            setTooltip(
              `SELECT DISTINCT ${groupByFields.join(
                ", "
              )} FROM power_rangers is roughly equivalent to: SELECT ${groupByFields.join(
                ", "
              )} FROM power_rangers GROUP BY ${groupByFields.join(", ")}`
            );
            setTimeout(() => setTooltip(null), 5000);
          } else {
            setTooltip(null);
          }
        }

        if (orderByColumn) {
          if (
            !powerRangersData.columns.some(
              (col) => col.name.toLowerCase() === orderByColumn.toLowerCase()
            )
          ) {
            setResult(`Error: Invalid column in ORDER BY: ${orderByColumn}`);
            setTooltip(null);
            return false;
          }

          const columnType = powerRangersData.columns.find(
            (col) => col.name.toLowerCase() === orderByColumn.toLowerCase()
          )?.type;

          resultData.sort((a, b) => {
            const aValue = a[orderByColumn as keyof PowerRanger] ?? "";
            const bValue = b[orderByColumn as keyof PowerRanger] ?? "";
            let comparison = 0;

            if (columnType === "integer") {
              const aNum = Number(aValue);
              const bNum = Number(bValue);
              comparison = aNum - bNum;
            } else {
              comparison = String(aValue).localeCompare(String(bValue));
            }

            return orderByDirection === "DESC" ? -comparison : comparison;
          });
        }

        if (limitValue !== undefined) {
          resultData = resultData.slice(0, limitValue);
        }

        try {
          setResult(JSON.stringify(resultData, null, 2));
        } catch {
          setResult("Error: Failed to generate valid JSON output");
          setTooltip(null);
          return false;
        }
        return true;
      }

      setResult("Error: Invalid query format");
      setTooltip(null);
      return false;
    },
    [setResult, setTooltip]
  );

  useEffect(() => {
    const getUniqueValues = (
      column: string,
      columnType: string | undefined
    ): string[] => {
      if (!columnType) return [];

      if (columnType === "integer") {
        return Array.from(
          new Set(
            powerRangersData.data.map((row) =>
              String(row[column as keyof PowerRanger])
            )
          )
        ).sort((a, b) => Number(a) - Number(b));
      }

      if (columnType === "date" || columnType === "text") {
        if (column.toLowerCase() === "season") {
          return uniqueSeasons.map((season) => `'${season}'`).sort();
        }
        return Array.from(
          new Set(
            powerRangersData.data.map(
              (row) => `'${String(row[column as keyof PowerRanger])}'`
            )
          )
        ).sort();
      }

      return [];
    };

    const getLikePatternSuggestions = (
      column: string,
      columnType: string | undefined
    ): string[] => {
      if (columnType !== "text") return [];

      const values = Array.from(
        new Set(
          powerRangersData.data.map((row) =>
            String(row[column as keyof PowerRanger])
          )
        )
      );

      const patterns: string[] = [];

      values.forEach((value) => {
        const len = value.length;
        // 1. Exact match
        patterns.push(`'${value}'`);
        // 2. Prefix patterns (e.g., 'B%')
        for (let i = 1; i <= Math.min(len, 4); i++) {
          const prefixPattern = `'${value.slice(0, i)}%'`;
          if (!patterns.includes(prefixPattern)) {
            patterns.push(prefixPattern);
          }
        }
        // 3. Suffix patterns (e.g., '%ue')
        for (let i = 1; i <= Math.min(len, 4); i++) {
          const suffixPattern = `'%${value.slice(-i)}'`;
          if (!patterns.includes(suffixPattern)) {
            patterns.push(suffixPattern);
          }
        }
        // 4. Contains patterns (e.g., '%lu%')
        for (let i = 1; i < len; i++) {
          for (let j = i + 1; j <= len; j++) {
            const substring = value.slice(i, j);
            if (substring.length >= 1 && substring.length <= 4) {
              const containsPattern = `'%${substring}%'`;
              if (!patterns.includes(containsPattern)) {
                patterns.push(containsPattern);
              }
            }
          }
        }
        // 5. Single character replacement with underscore (e.g., 'B_ue')
        if (len >= 2) {
          for (let i = 0; i < len; i++) {
            const pattern = `'${value.slice(0, i)}${value.slice(i + 1)}'`;
            if (!patterns.includes(pattern)) {
              patterns.push(pattern);
            }
            const underscorePattern = `'${value.slice(0, i)}${
              value[i]
            }_${value.slice(i + 1)}'`;
            if (!patterns.includes(underscorePattern)) {
              patterns.push(underscorePattern);
            }
          }
        }
        // 6. Patterns with underscores for each character (e.g., 'B___')
        if (len > 1) {
          const underscorePattern = `'${Array(len).fill("_").join("")}'`;
          if (!patterns.includes(underscorePattern)) {
            patterns.push(underscorePattern);
          }
        }
        // 7. Partial prefix with underscore (e.g., 'Bl_e')
        if (len > 2) {
          for (let i = 2; i < len; i++) {
            const partialPattern = `'${value.slice(0, i - 1)}${
              value[i - 1]
            }_${value.slice(i)}'`;
            if (!patterns.includes(partialPattern)) {
              patterns.push(partialPattern);
            }
          }
        }
      });
      // 8. Generic patterns based on column
      patterns.push(`'%${column.slice(0, 1).toUpperCase()}%'`);
      patterns.push(`'${column.slice(0, 1).toUpperCase()}%'`);
      patterns.push(`'%${column.slice(0, 1).toLowerCase()}%'`);

      return Array.from(new Set(patterns)).sort();
    };

    const getColumnOptions = (excludeFields: string[]) =>
      powerRangersData.columns
        .filter((col) => !excludeFields.includes(col.name.toLowerCase()))
        .map((col) => ({
          label: col.name,
          type: "field",
          detail: `${col.type}, ${col.notNull ? "not null" : "nullable"}`,
          apply: col.name,
        }));

    const getUsedColumnsInWhere = (whereClause: string): string[] => {
      const usedColumns: string[] = [];
      const conditionParts = whereClause
        .split(/\s+(AND|OR)\s+/i)
        .filter((_, index) => index % 2 === 0)
        .map((part) => part.trim());
      for (const part of conditionParts) {
        const conditionMatch = part.match(
          /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|BETWEEN|IS NULL|IS NOT NULL)/i
        );
        if (conditionMatch) {
          const column = conditionMatch[1].toLowerCase();
          if (
            powerRangersData.columns.some(
              (col) => col.name.toLowerCase() === column
            )
          ) {
            usedColumns.push(column);
          }
        }
      }
      return Array.from(new Set(usedColumns));
    };

    const completion = (ctx: CompletionContext) => {
      const word = ctx.matchBefore(/[\w*']*|^/);
      const docText = ctx.state.doc.toString().toLowerCase();
      const fullDocText = ctx.state.doc.toString();
      const cursorPos = ctx.pos;

      const selectMatch = fullDocText
        .substring(0, cursorPos)
        .match(
          /^select\s+(?:distinct\s+|(?:(?:count|sum|max|min|avg|round)\s*\([\w*]+(?:,\s*\d+)?\)\s*(?:as\s+'.*?'\s*)?,)*)?(.+?)?(?:\s+from|$)/i
        );

      const alreadySelectedFields =
        selectMatch && selectMatch[1]
          ? selectMatch[1]
              .split(/(?<!\([^()]*),(?![^()]*\))/)
              .map((f) =>
                f
                  .trim()
                  .replace(/\s+as\s+'.*?'$/i, "")
                  .replace(/^round\s*\(\s*avg\s*\((\w+)\)\s*\)$/i, "$1")
                  .toLowerCase()
              )
              .filter((f) => f)
          : [];

      const selectFields =
        selectMatch && selectMatch[1]
          ? selectMatch[1]
              .split(/(?<!\([^()]*),(?![^()]*\))/)
              .map((f) => f.trim())
              .filter((f) => f)
              .map((f, index) => ({ field: f, index: index + 1 }))
          : [];

      // 1. Suggest SQL keywords when editor is empty or typing a keyword
      if (/^\s*$|^s(el(ect)?)?$|^d(esc(ribe)?)?$|^sh(ow)?$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            {
              label: "SELECT",
              type: "keyword",
              apply: "SELECT ",
              detail: "Select data from a table",
            },
            {
              label: "DESCRIBE",
              type: "keyword",
              apply: "DESCRIBE ",
              detail: "Describe table structure",
            },
            {
              label: "SHOW TABLES",
              type: "keyword",
              apply: "SHOW TABLES",
              detail: "List all tables",
            },
          ],
        };
      }

      // 2. After DESCRIBE, suggest the table
      if (/^describe\s*$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            {
              label: "power_rangers",
              type: "table",
              apply: "power_rangers",
              detail: "Table name",
            },
          ],
        };
      }

      // 3. After SELECT, suggest columns, *, COUNT(*), COUNT(column), SUM(column), MAX(column), MIN(column), AVG(column), ROUND(column, decimals), DISTINCT
      if (/^select\s*$/i.test(docText)) {
        const options = getColumnOptions(alreadySelectedFields);
        options.unshift(
          { label: "*", type: "field", detail: "all columns", apply: "*" },
          {
            label: "DISTINCT",
            type: "keyword",
            apply: "DISTINCT ",
            detail: "Select unique values",
          },
          {
            label: "COUNT(*)",
            type: "function",
            apply: "COUNT(*)",
            detail: "Count all rows",
          },
          ...powerRangersData.columns.map((col) => ({
            label: `COUNT(${col.name})`,
            type: "function",
            apply: `COUNT(${col.name})`,
            detail: `Count non-null values in ${col.name}`,
          })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer")
            .map((col) => ({
              label: `SUM(${col.name})`,
              type: "function",
              apply: `SUM(${col.name})`,
              detail: `Sum values in ${col.name}`,
            })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer" || col.type === "date")
            .map((col) => ({
              label: `MAX(${col.name})`,
              type: "function",
              apply: `MAX(${col.name})`,
              detail: `Maximum value in ${col.name}`,
            })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer" || col.type === "date")
            .map((col) => ({
              label: `MIN(${col.name})`,
              type: "function",
              apply: `MIN(${col.name})`,
              detail: `Minimum value in ${col.name}`,
            })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer")
            .map((col) => ({
              label: `AVG(${col.name})`,
              type: "function",
              apply: `AVG(${col.name})`,
              detail: `Average value in ${col.name}`,
            })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer")
            .map((col) => ({
              label: `ROUND(${col.name}, `,
              type: "function",
              apply: `ROUND(${col.name}, `,
              detail: `Round values in ${col.name} to specified decimals`,
            })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer")
            .map((col) => ({
              label: `ROUND(AVG(${col.name}), `,
              type: "function",
              apply: `ROUND(AVG(${col.name}), `,
              detail: `Round average of ${col.name} to specified decimals`,
            }))
        );
        return { from: word?.from ?? cursorPos, options };
      }

      // 4. After SELECT DISTINCT, suggest columns
      if (/^select\s+distinct\s*$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: getColumnOptions(alreadySelectedFields),
        };
      }

      // 5. After comma in SELECT, suggest remaining columns and aggregates
      if (
        /^select\s+(?:distinct\s+)?[\w\s,'*]+$/i.test(docText) &&
        /,\s*$/.test(docText.substring(0, cursorPos)) &&
        !docText.includes("from")
      ) {
        const options = getColumnOptions(alreadySelectedFields);
        options.push(
          {
            label: "COUNT(*)",
            type: "function",
            apply: "COUNT(*)",
            detail: "Count all rows",
          },
          ...powerRangersData.columns.map((col) => ({
            label: `COUNT(${col.name})`,
            type: "function",
            apply: `COUNT(${col.name})`,
            detail: `Count non-null values in ${col.name}`,
          })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer")
            .map((col) => ({
              label: `SUM(${col.name})`,
              type: "function",
              apply: `SUM(${col.name})`,
              detail: `Sum values in ${col.name}`,
            })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer" || col.type === "date")
            .map((col) => ({
              label: `MAX(${col.name})`,
              type: "function",
              apply: `MAX(${col.name})`,
              detail: `Maximum value in ${col.name}`,
            })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer" || col.type === "date")
            .map((col) => ({
              label: `MIN(${col.name})`,
              type: "function",
              apply: `MIN(${col.name})`,
              detail: `Minimum value in ${col.name}`,
            })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer")
            .map((col) => ({
              label: `AVG(${col.name})`,
              type: "function",
              apply: `AVG(${col.name})`,
              detail: `Average value in ${col.name}`,
            })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer")
            .map((col) => ({
              label: `ROUND(${col.name}, `,
              type: "function",
              apply: `ROUND(${col.name}, `,
              detail: `Round values in ${col.name} to specified decimals`,
            })),
          ...powerRangersData.columns
            .filter((col) => col.type === "integer")
            .map((col) => ({
              label: `ROUND(AVG(${col.name}), `,
              type: "function",
              apply: `ROUND(AVG(${col.name}), `,
              detail: `Round average of ${col.name} to specified decimals`,
            }))
        );
        return { from: word?.from ?? cursorPos, options };
      }

      // 6. After a field or aggregate (with or without alias), suggest , AS, FROM, GROUP BY
      if (
        /^select\s+(?:distinct\s+)?(?:[\w*]+|(?:count|sum|max|min|avg|round)\s*\((?:[\w*]+|\*|\([^)]+\))(?:,\s*\d+)?\)(?:\s+as\s+'.*?')?)(?:\s*,\s*(?:[\w*]+|(?:count|sum|max|min|avg|round)\s*\((?:[\w*]+|\*|\([^)]+\))(?:,\s*\d+)?\)(?:\s+as\s+'.*?')?))*\s*$/i.test(
          fullDocText.substring(0, cursorPos).trim()
        ) &&
        !fullDocText.toLowerCase().includes("from")
      ) {
        const fieldsBeforeCursor = fullDocText.match(
          /^select\s+(?:distinct\s+)?(.+)$/i
        )?.[1];
        if (fieldsBeforeCursor) {
          const fields = fieldsBeforeCursor
            .split(/(?<!\([^()]*),(?![^()]*\))/g)
            .map((field) => field.trim())
            .filter((f) => f);

          const lastField = fields[fields.length - 1] || "";
          const lastFieldClean = lastField
            .replace(/\s+as\s+'.*?'$/i, "")
            .trim();
          const isAggregate =
            /^(count|sum|max|min|avg|round)\s*\((?:[\w*]+|\*|\([^)]+\))(?:,\s*\d+)?\)$/i.test(
              lastFieldClean
            );
          const isNestedAggregate =
            /^round\s*\(\s*avg\s*\(\w+\)\s*(?:,\s*\d+)?\)$/i.test(
              lastFieldClean
            );
          const isColumn =
            lastFieldClean.toLowerCase() === "*" ||
            powerRangersData.columns.some(
              (col) => col.name.toLowerCase() === lastFieldClean.toLowerCase()
            );
          const hasAlias = /\s+as\s+'.*?'$/i.test(lastField);

          // Check if cursor is after a valid field, aggregate, or nested aggregate
          const cursorAfterFieldOrAggregate =
            lastFieldClean.length > 0 ||
            fullDocText.substring(0, cursorPos).trim().endsWith(lastFieldClean);

          if (
            (isColumn || isAggregate || isNestedAggregate) &&
            cursorAfterFieldOrAggregate
          ) {
            const formattedAlias = isAggregate
              ? lastFieldClean
                  .match(/^(count|sum|max|min|avg|round)/i)?.[1]
                  .toLowerCase()
              : isNestedAggregate
              ? lastFieldClean.match(
                  /^round\s*\(\s*avg\s*\(\w+\)\s*(?:,\s*(\d+))?\)$/i
                )
                ? "round_avg"
                : undefined
              : lastFieldClean.toLowerCase() === "*"
              ? undefined
              : formatColumnName(lastFieldClean);

            const options = [
              {
                label: ",",
                type: "operator",
                apply: ", ",
                detail: "Add another field",
              },
              {
                label: "FROM",
                type: "keyword",
                apply: " FROM ",
                detail: "Specify table",
              },
              {
                label: "GROUP BY",
                type: "keyword",
                apply: " GROUP BY ",
                detail: "Group results by columns",
              },
            ];

            if (!hasAlias && formattedAlias) {
              options.unshift({
                label: "AS",
                type: "keyword",
                apply: ` AS '${formattedAlias}' `,
                detail: "Alias the column",
              });
            }

            return { from: cursorPos, options };
          }
        }
      }

      // 7. After AS 'alias', suggest , FROM, GROUP BY
      if (/as\s*'.*?'\s*$/i.test(docText) && !docText.includes("from")) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            {
              label: ",",
              type: "operator",
              apply: ", ",
              detail: "Add another field",
            },
            {
              label: "FROM",
              type: "keyword",
              apply: " FROM ",
              detail: "Specify table",
            },
            {
              label: "GROUP BY",
              type: "keyword",
              apply: " GROUP BY ",
              detail: "Group results by columns",
            },
          ],
        };
      }

      // 8. After FROM, suggest power_rangers
      if (/from\s*$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            {
              label: "power_rangers",
              type: "table",
              apply: "power_rangers ",
              detail: "Table name",
            },
          ],
        };
      }

      // 9. After FROM power_rangers, suggest WHERE, GROUP BY, ORDER BY, or LIMIT
      if (/from\s+power_rangers\s*$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            {
              label: "WHERE",
              type: "keyword",
              apply: "WHERE ",
              detail: "Filter rows",
            },
            {
              label: "GROUP BY",
              type: "keyword",
              apply: "GROUP BY ",
              detail: "Group results by columns",
            },
            {
              label: "ORDER BY",
              type: "keyword",
              apply: "ORDER BY ",
              detail: "Sort results",
            },
            {
              label: "LIMIT",
              type: "keyword",
              apply: "LIMIT ",
              detail: "Limit number of rows",
            },
          ],
        };
      }

      // 10. After GROUP BY, suggest columns or numeric references
      if (/group\s+by\s*$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            ...getColumnOptions(alreadySelectedFields),
            ...selectFields.map(({ field, index }) => ({
              label: `${index}`,
              type: "value",
              apply: `${index}`,
              detail: `Reference to ${field}`,
            })),
          ],
        };
      }

      // 11. After GROUP BY column or number, suggest comma, remaining columns/numbers, HAVING, ORDER BY, or LIMIT
      if (
        /group\s+by\s+(?:\w+|\d+)(?:\s*,\s*(?:\w+|\d+))*\s*$/i.test(docText)
      ) {
        const groupByMatch = docText.match(/group\s+by\s+(.+)/i);
        const usedFields = groupByMatch
          ? groupByMatch[1]
              .split(",")
              .map((f) => f.trim())
              .filter((f) => f)
          : [];

        const availableColumns = powerRangersData.columns.filter(
          (col) => !usedFields.includes(col.name.toLowerCase())
        );

        const availableSelectFields = selectFields.filter(
          ({ index }) => !usedFields.includes(`${index}`)
        );

        return {
          from: word?.from ?? cursorPos,
          options: [
            {
              label: "HAVING",
              type: "keyword",
              apply: " HAVING ",
              detail: "Filter groups based on aggregate conditions",
            },
            {
              label: "ORDER BY",
              type: "keyword",
              apply: " ORDER BY ",
              detail: "Sort results",
            },
            {
              label: "LIMIT",
              type: "keyword",
              apply: " LIMIT ",
              detail: "Limit number of rows",
            },
            ...availableColumns.map((col) => ({
              label: col.name,
              type: "field",
              apply: col.name,
              detail: `${col.type}, ${col.notNull ? "not null" : "nullable"}`,
            })),
            ...availableSelectFields.map(({ field, index }) => ({
              label: `${index}`,
              type: "value",
              apply: `${index}`,
              detail: `Reference to ${field}`,
            })),
          ],
        };
      }

      // 12. After WHERE, suggest columns
      if (/from\s+power_rangers\s+where\s*$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: getColumnOptions([]),
        };
      }

      // 13. After a complete condition, suggest AND, OR, GROUP BY, ORDER BY, or LIMIT
      if (
        /from\s+power_rangers\s+where\s+.*?(?:\w+\s*(=|\!=|>|<|>=|<=|LIKE)\s*('[^']*'|[^' ]\w*)|\w+\s*BETWEEN\s*('[^']*'|[^' ]\w*)\s*AND\s*('[^']*'|[^' ]\w*)|\w+\s*(IS NULL|IS NOT NULL))\s*$/i.test(
          docText
        )
      ) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            {
              label: "AND",
              type: "keyword",
              apply: " AND ",
              detail: "Combine with another condition (all must be true)",
            },
            {
              label: "OR",
              type: "keyword",
              apply: " OR ",
              detail: "Combine with another condition (any can be true)",
            },
            {
              label: "GROUP BY",
              type: "keyword",
              apply: " GROUP BY ",
              detail: "Group results by columns",
            },
            {
              label: "ORDER BY",
              type: "keyword",
              apply: " ORDER BY ",
              detail: "Sort results",
            },
            {
              label: "LIMIT",
              type: "keyword",
              apply: " LIMIT ",
              detail: "Limit number of rows",
            },
          ],
        };
      }

      // 14. After WHERE column, suggest operators
      if (
        /from\s+power_rangers\s+where\s+.*?\b(\w+)\s*$/i.test(docText) &&
        powerRangersData.columns.some((col) =>
          new RegExp(`\\b${col.name.toLowerCase()}\\s*$`, "i").test(docText)
        )
      ) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            { label: "=", type: "operator", apply: "= ", detail: "Equal to" },
            {
              label: "!=",
              type: "operator",
              apply: "!= ",
              detail: "Not equal to",
            },
            {
              label: ">",
              type: "operator",
              apply: "> ",
              detail: "Greater than",
            },
            { label: "<", type: "operator", apply: "< ", detail: "Less than" },
            {
              label: ">=",
              type: "operator",
              apply: ">= ",
              detail: "Greater than or equal to",
            },
            {
              label: "<=",
              type: "operator",
              apply: "<= ",
              detail: "Less than or equal to",
            },
            {
              label: "LIKE",
              type: "operator",
              apply: "LIKE ",
              detail: "Pattern matching",
            },
            {
              label: "BETWEEN",
              type: "operator",
              apply: "BETWEEN ",
              detail: "Range filter",
            },
            {
              label: "IS NULL",
              type: "operator",
              apply: "IS NULL ",
              detail: "Check for null values",
            },
            {
              label: "IS NOT NULL",
              type: "operator",
              apply: "IS NOT NULL ",
              detail: "Check for non-null values",
            },
          ],
        };
      }

      // 15. After WHERE column operator, suggest values
      const valuePattern =
        /from\s+power_rangers\s+where\s+(?:.*?\s+(?:and|or)\s+)?(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|BETWEEN)\s*(?:('[^']*'|[^' ]\w*)?)?$/i;
      if (valuePattern.test(docText)) {
        const match = docText.match(valuePattern);
        if (match) {
          const column = match[1];
          const operator = match[2];
          const value1 = match[3];
          const columnType = powerRangersData.columns.find(
            (col) => col.name.toLowerCase() === column?.toLowerCase()
          )?.type;

          if (operator.toUpperCase() === "BETWEEN") {
            if (!value1) {
              const sampleValues = getUniqueValues(column, columnType);
              return {
                from: word?.from ?? cursorPos,
                options: sampleValues.map((value) => ({
                  label: value,
                  type: "value",
                  apply: value + " AND ",
                  detail: "First value for BETWEEN",
                })),
              };
            } else {
              const sampleValues = getUniqueValues(column, columnType);
              return {
                from: word?.from ?? cursorPos,
                options: sampleValues.map((value) => ({
                  label: value,
                  type: "value",
                  apply: value,
                  detail: "Second value for BETWEEN",
                })),
              };
            }
          }

          if (operator.toUpperCase() === "LIKE") {
            const likePatterns = getLikePatternSuggestions(column, columnType);
            return {
              from: word?.from ?? cursorPos,
              options: likePatterns.map((pattern) => ({
                label: pattern,
                type: "value",
                apply: pattern,
                detail: "LIKE pattern",
              })),
            };
          }

          if (["IS NULL", "IS NOT NULL"].includes(operator.toUpperCase())) {
            return null;
          }

          const sampleValues = getUniqueValues(column, columnType);
          return {
            from: word?.from ?? cursorPos,
            options: sampleValues.map((value) => ({
              label: value,
              type: "value",
              apply: value,
              detail: "Value",
            })),
          };
        }
      }

      // 16. After AND or OR, suggest remaining columns
      if (/from\s+power_rangers\s+where\s+.*?\s+(and|or)\s*$/i.test(docText)) {
        const whereClause =
          docText.match(/where\s+(.+?)\s+(?:and|or)\s*$/i)?.[1] || "";
        const usedColumns = getUsedColumnsInWhere(whereClause);
        return {
          from: word?.from ?? cursorPos,
          options: getColumnOptions(usedColumns),
        };
      }

      // 17. Suggest number after LIMIT
      if (
        /from\s+power_rangers\s+(?:where\s+.*?\s+)?(?:group\s+by\s+.*?\s+)?limit\s*$/i.test(
          docText
        )
      ) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
            "19",
            "20",
          ].map((num) => ({
            label: num,
            type: "value",
            apply: num,
            detail: `Limit to ${num} ${num === "1" ? "row" : "rows"}`,
            boost: -Number(num),
          })),
        };
      }

      // 18. After ROUND(column, suggest decimal places)
      if (/^select\s+round\s*\(\w+,\s*$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: ["0", "1", "2", "3", "4"].map((num) => ({
            label: num,
            type: "value",
            apply: `${num})`,
            detail: `Round to ${num} decimal place${num === "1" ? "" : "s"}`,
          })),
        };
      }

      // 19. After ORDER BY, suggest columns
      if (/order\s+by\s*$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: getColumnOptions([]),
        };
      }

      // 20. After ORDER BY column, suggest ASC, DESC, or LIMIT
      if (/order\s+by\s+\w+\s*$/i.test(docText)) {
        const orderByColumn = docText.match(/order\s+by\s+(\w+)\s*$/i)?.[1];
        if (
          orderByColumn &&
          powerRangersData.columns.some(
            (col) => col.name.toLowerCase() === orderByColumn.toLowerCase()
          )
        ) {
          return {
            from: word?.from ?? cursorPos,
            options: [
              {
                label: "ASC",
                type: "keyword",
                apply: " ASC ",
                detail: "Sort in ascending order",
              },
              {
                label: "DESC",
                type: "keyword",
                apply: " DESC ",
                detail: "Sort in descending order",
              },
              {
                label: "LIMIT",
                type: "keyword",
                apply: " LIMIT ",
                detail: "Limit number of rows",
              },
            ],
          };
        }
      }

      // 21. After GROUP BY columns, suggest HAVING, ORDER BY, or LIMIT
      if (
        /group\s+by\s+(?:\w+|\d+)(?:\s*,\s*(?:\w+|\d+))*\s*$/i.test(docText)
      ) {
        const groupByMatch = docText.match(/group\s+by\s+(.+)/i);
        const usedFields = groupByMatch
          ? groupByMatch[1]
              .split(",")
              .map((f) => f.trim())
              .filter((f) => f)
          : [];

        const availableColumns = powerRangersData.columns.filter(
          (col) => !usedFields.includes(col.name.toLowerCase())
        );
        const availableSelectFields = selectFields.filter(
          ({ index }) => !usedFields.includes(`${index}`)
        );

        return {
          from: word?.from ?? cursorPos,
          options: [
            {
              label: "HAVING",
              type: "keyword",
              apply: " HAVING ",
              detail: "Filter groups based on aggregate conditions",
            },
            {
              label: "ORDER BY",
              type: "keyword",
              apply: " ORDER BY ",
              detail: "Sort results",
            },
            {
              label: "LIMIT",
              type: "keyword",
              apply: " LIMIT ",
              detail: "Limit number of rows",
            },
            ...availableColumns.map((col) => ({
              label: col.name,
              type: "field",
              apply: col.name,
              detail: `${col.type}, ${col.notNull ? "not null" : "nullable"}`,
            })),
            ...availableSelectFields.map(({ field, index }) => ({
              label: `${index}`,
              type: "value",
              apply: `${index}`,
              detail: `Reference to ${field}`,
            })),
          ],
        };
      }

      // 22. After HAVING, suggest aggregate functions
      if (/having\s*$/i.test(docText)) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            {
              label: "COUNT(*)",
              type: "function",
              apply: "COUNT(*) ",
              detail: "Count all rows",
            },
            ...powerRangersData.columns.map((col) => ({
              label: `COUNT(${col.name})`,
              type: "function",
              apply: `COUNT(${col.name}) `,
              detail: `Count non-null values in ${col.name}`,
            })),
            ...powerRangersData.columns
              .filter((col) => col.type === "integer")
              .map((col) => ({
                label: `SUM(${col.name})`,
                type: "function",
                apply: `SUM(${col.name}) `,
                detail: `Sum values in ${col.name}`,
              })),
            ...powerRangersData.columns
              .filter((col) => col.type === "integer" || col.type === "date")
              .map((col) => ({
                label: `MAX(${col.name})`,
                type: "function",
                apply: `MAX(${col.name}) `,
                detail: `Maximum value in ${col.name}`,
              })),
            ...powerRangersData.columns
              .filter((col) => col.type === "integer" || col.type === "date")
              .map((col) => ({
                label: `MIN(${col.name})`,
                type: "function",
                apply: `MIN(${col.name}) `,
                detail: `Minimum value in ${col.name}`,
              })),
            ...powerRangersData.columns
              .filter((col) => col.type === "integer")
              .map((col) => ({
                label: `AVG(${col.name})`,
                type: "function",
                apply: `AVG(${col.name}) `,
                detail: `Average value in ${col.name}`,
              })),
          ],
        };
      }

      // 23. After HAVING aggregate, suggest operators
      if (
        /having\s*(count|sum|max|min|avg)\s*\((?:[*]|\w+)\)\s*$/i.test(docText)
      ) {
        return {
          from: word?.from ?? cursorPos,
          options: [
            { label: "=", type: "operator", apply: "= ", detail: "Equal to" },
            {
              label: "!=",
              type: "operator",
              apply: "!= ",
              detail: "Not equal to",
            },
            {
              label: ">",
              type: "operator",
              apply: "> ",
              detail: "Greater than",
            },
            { label: "<", type: "operator", apply: "< ", detail: "Less than" },
            {
              label: ">=",
              type: "operator",
              apply: ">= ",
              detail: "Greater than or equal to",
            },
            {
              label: "<=",
              type: "operator",
              apply: "<= ",
              detail: "Less than or equal to",
            },
          ],
        };
      }

      // 24. After HAVING aggregate operator, suggest numeric values
      if (
        /having\s*(count|sum|max|min|avg)\s*\((?:[*]|\w+)\)\s*(=|\!=|>|<|>=|<=)\s*$/i.test(
          docText
        )
      ) {
        return {
          from: word?.from ?? cursorPos,
          options: ["0", "1", "2", "3", "4", "5", "10", "15", "20"].map(
            (num) => ({
              label: num,
              type: "value",
              apply: num,
              detail: `Value ${num}`,
            })
          ),
        };
      }

      return null;
    };

    const state = EditorState.create({
      doc: "",
      extensions: [
        sql(),
        oneDark,
        keymap.of([
          indentWithTab,
          {
            key: "Mod-Enter",
            run: (view) => {
              runQuery(view);
              return true;
            },
          },
          { key: "Ctrl-Space", run: startCompletion },
          ...defaultKeymap,
        ]),
        autocompletion({ override: [completion], activateOnTyping: false }),
      ],
    });

    const view = new EditorView({
      state,
      parent: document.getElementById("editor")!,
    });

    editorRef.current = view;
    return () => {
      view.destroy();
    };
  }, [runQuery, uniqueSeasons]);

  const isJson = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const renderResult = () => {
    if (!result) {
      return (
        <div className="text-center text-slate-400 italic py-8">
          The results of your query will appear here.
        </div>
      );
    }

    if (viewMode === "json") {
      return isJson(result) ? (
        <pre className="text-green-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {result}
        </pre>
      ) : (
        <div className="text-red-400">{result}</div>
      );
    }

    if (isJson(result)) {
      const jsonData: QueryResult[] = JSON.parse(result);
      return (
        <div className="w-full overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900">
                {Object.keys(jsonData[0] ?? {}).map((key) => (
                  <th
                    key={key}
                    className="p-3 text-left text-green-400 font-medium"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jsonData.map((row: QueryResult, rowIndex: number) => (
                <tr
                  key={rowIndex}
                  className={
                    rowIndex % 2 === 0 ? "bg-slate-800" : "bg-slate-900"
                  }
                >
                  {Object.values(row).map(
                    (value: string | number, colIndex: number) => (
                      <td
                        key={colIndex}
                        className="p-3 text-green-200 border-b border-slate-700"
                      >
                        {String(value)}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return <div className="text-red-400">{result}</div>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0f172a] text-white p-6 space-y-4 md:space-y-0 md:space-x-4 font-mono">
      <div className="w-full md:w-1/2">
        <div
          id="editor"
          className="h-[70vh] border border-slate-700 rounded-xl bg-[#1e293b] p-3 text-sm"
        />
        <div className="relative group inline-block">
          <button
            onClick={() => editorRef.current && runQuery(editorRef.current)}
            className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition"
          >
            ▶ Run Query
          </button>
          <div className="relative">
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-1.5 whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-bottom-2">
              {navigator.platform.includes("Mac") ? "⌘+Enter" : "Ctrl+Enter"}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full md:w-1/2 bg-[#1e293b] rounded-xl p-4 overflow-auto text-sm border border-slate-700 relative">
        <div className="flex justify-end mb-4">
          <ViewToggle onViewModeChange={setViewMode} />
        </div>
        {tooltip && <Tooltip message={tooltip} />}
        {renderResult()}
      </div>
    </div>
  );
}
