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

interface Column {
  name: string;
  type: string;
  notNull: boolean;
}

interface Table {
  tableName: string;
  columns: Column[];
  data: PowerRanger[];
}

interface CompletionOption {
  label: string;
  type: string;
  apply: string;
  detail: string;
  boost?: number;
}

interface PowerRanger {
  id: number;
  user: string;
  ranger_color: string;
  ranger_designation: string;
  weapon: string[];
  season_id: number;
  joined_date: string;
  status: string;
  power_level: number;
  location: string;
  gear: string[];
  zord: string[];
}

interface ColumnDef {
  name: string;
  type: "integer" | "float" | "text" | "date" | "text[]";
  notNull: boolean;
}

interface PowerRangersData {
  tableName: string;
  columns: ColumnDef[];
  data: PowerRanger[];
}

interface ShowTablesResult {
  table_name: string;
}

interface DescribeResult {
  field: string;
  type: string;
  null: "YES" | "NO";
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

const tables: Record<string, PowerRangersData> = {
  mighty_morphin_power_rangers: {
    tableName: "mighty_morphin_power_rangers",
    columns: [
      { name: "id", type: "integer", notNull: true },
      { name: "user", type: "text", notNull: true },
      { name: "ranger_color", type: "text", notNull: true },
      { name: "ranger_designation", type: "text", notNull: true },
      { name: "weapon", type: "text[]", notNull: true },
      { name: "season_id", type: "integer", notNull: true },
      { name: "joined_date", type: "date", notNull: true },
      { name: "status", type: "text", notNull: true },
      { name: "power_level", type: "float", notNull: true },
      { name: "location", type: "text", notNull: true },
      { name: "gear", type: "text[]", notNull: true },
      { name: "zord", type: "text[]", notNull: true },
    ],
    data: [
      {
        id: 1,
        user: "Jason Lee Scott",
        ranger_color: "Red",
        ranger_designation: "Red Power Ranger",
        weapon: [
          "Power Sword",
          "Blade Blaster",
          "Dragon Dagger (post Green Ranger)",
        ],
        season_id: 1,
        joined_date: "1993-08-28",
        status: "Active",
        power_level: 90.24321,
        location: "Angel Grove",
        gear: [
          "Wrist Communicator",
          "Power Morpher with Power Coin",
          "Dragon Shield (post Green Ranger)",
        ],
        zord: [
          "Tyrannosaurus Dinozord",
          "Dragonzord (post Green Ranger)",
          "Red Dragon Thunderzord",
        ],
      },
      {
        id: 2,
        user: "Zack Taylor",
        ranger_color: "Black",
        ranger_designation: "Black Power Ranger",
        weapon: ["Power Axe", "Blade Blaster"],
        season_id: 1,
        joined_date: "1993-08-28",
        status: "Active",
        power_level: 82,
        location: "Angel Grove",
        gear: ["Wrist Communicator", "Power Morpher with Power Coin"],
        zord: ["Mastodon Dinozord", "Lion Thunderzord"],
      },
      {
        id: 3,
        user: "Trini Kwan",
        ranger_color: "Yellow",
        ranger_designation: "Yellow Power Ranger",
        weapon: ["Power Daggers", "Blade Blaster"],
        season_id: 1,
        joined_date: "1993-08-28",
        status: "Active",
        power_level: 85.4754,
        location: "Angel Grove",
        gear: ["Wrist Communicator", "Power Morpher with Power Coin"],
        zord: ["Sabertooth Tiger Dinozord", "Griffin Thunderzord"],
      },
      {
        id: 4,
        user: "Kimberly Hart",
        ranger_color: "Pink",
        ranger_designation: "Pink Power Ranger, Pink Ninja Ranger",
        weapon: ["Power Bow", "Blade Blaster"],
        season_id: 1,
        joined_date: "1993-08-28",
        status: "Active",
        power_level: 88,
        location: "Angel Grove",
        gear: [
          "Wrist Communicator",
          "Power Morpher with Power Coin",
          "Pink Shark Cycle",
        ],
        zord: [
          "Pterodactyl Dinozord",
          "Firebird Thunderzord",
          "Crane Ninja Zord",
          "White Shogun Zord (shared with White Ranger)",
        ],
      },
      {
        id: 5,
        user: "Billy Cranston",
        ranger_color: "Blue",
        ranger_designation: "Blue Power Ranger, Blue Ninja Ranger",
        weapon: ["Power Lance", "Blade Blaster"],
        season_id: 1,
        joined_date: "1993-08-28",
        status: "Active",
        power_level: 80.24,
        location: "Angel Grove",
        gear: [
          "Wrist Communicator",
          "Power Morpher with Power Coin",
          "Metallic Armor",
          "Blue Shark Cycle",
        ],
        zord: [
          "Triceratops Dinozord",
          "Unicorn Thunderzord",
          "Wolf Ninja Zord",
          "Blue Shogun Zord",
        ],
      },
      {
        id: 6,
        user: "Tommy Oliver",
        ranger_color: "Green",
        ranger_designation: "Green Power Ranger",
        weapon: ["Dragon Dagger"],
        season_id: 1,
        joined_date: "1993-10-10",
        status: "Active",
        power_level: 95,
        location: "Angel Grove",
        gear: [
          "Dragon Shield",
          "Power Morpher with Power Coin",
          "Wrist Communicator",
        ],
        zord: ["Dragonzord"],
      },
      {
        id: 7,
        user: "Tommy Oliver",
        ranger_color: "White",
        ranger_designation: "White Power Ranger, White Ninja Ranger",
        weapon: ["Saba"],
        season_id: 1,
        joined_date: "1994-01-10",
        status: "Active",
        power_level: 97,
        location: "Angel Grove",
        gear: [
          "White Ranger Shield",
          "Power Morpher with Power Coin",
          "White Shark Cycle",
          "Wrist Communicator",
        ],
        zord: ["Tigerzord", "Falconzord", "White Shogunzord"],
      },
    ],
  },
  power_rangers_zeo: {
    tableName: "power_rangers_zeo",
    columns: [
      { name: "id", type: "integer", notNull: true },
      { name: "user", type: "text", notNull: true },
      { name: "ranger_color", type: "text", notNull: true },
      { name: "ranger_designation", type: "text", notNull: true },
      { name: "weapon", type: "text[]", notNull: true },
      { name: "season_id", type: "integer", notNull: true },
      { name: "joined_date", type: "date", notNull: true },
      { name: "status", type: "text", notNull: true },
      { name: "power_level", type: "float", notNull: true },
      { name: "location", type: "text", notNull: true },
      { name: "gear", type: "text[]", notNull: true },
      { name: "zord", type: "text[]", notNull: true },
    ],
    data: [
      {
        id: 8,
        user: "Tommy Oliver",
        ranger_color: "Red",
        ranger_designation: "Zeo Ranger V - Red",
        weapon: ["Zeo Pistol", "Zeo Blade", "Sword"],
        season_id: 2, // Zeo
        joined_date: "1996-04-20",
        status: "Active",
        power_level: 100,
        location: "Angel Grove",
        gear: [
          "Wrist Communicator",
          "Zeonizer with Zeo Crystal",
          "Red Zeo Jet Cycle",
        ],
        zord: ["Zeo Zord Five", "Red Battlezord", "Super Zeo Zord Five"],
      },
      {
        id: 9,
        user: "Rocky DeSantos",
        ranger_color: "Blue",
        ranger_designation: "Zeo Ranger III - Blue",
        weapon: ["Zeo Pistol", "Zeo Blade", "Axes"],
        season_id: 2,
        joined_date: "1996-04-20",
        status: "Active",
        power_level: 98,
        location: "Angel Grove",
        gear: [
          "Wrist Communicator",
          "Zeonizer with Zeo Crystal",
          "Blue Zeo Jet Cycle",
        ],
        zord: ["Zeo Zord Three", "Super Zeo Zord Three"],
      },
      {
        id: 10,
        user: "Adam Park",
        ranger_color: "Green",
        ranger_designation: "Zeo Ranger IV - Green",
        weapon: ["Zeo Pistol", "Zeo Blade", "Hatchets"],
        season_id: 2,
        joined_date: "1996-04-20",
        status: "Active",
        power_level: 95,
        location: "Angel Grove",
        gear: [
          "Wrist Communicator",
          "Zeonizer with Zeo Crystal",
          "Green Zeo Jet Cycle",
        ],
        zord: ["Zeo Zord Four", "Super Zeo Zord Four"],
      },
      {
        id: 11,
        user: "Katherine Hillard",
        ranger_color: "Pink",
        ranger_designation: "Zeo Ranger I - Pink",
        weapon: ["Zeo Pistol", "Zeo Blade", "Disc"],
        season_id: 2,
        joined_date: "1996-04-20",
        status: "Active",
        power_level: 92,
        location: "Angel Grove",
        gear: [
          "Wrist Communicator",
          "Zeonizer with Zeo Crystal",
          "Pink Zeo Jet Cycle",
        ],
        zord: ["Zeo Zord One", "Super Zeo Zord One"],
      },
      {
        id: 12,
        user: "Tanya Sloan",
        ranger_color: "Yellow",
        ranger_designation: "Zeo Ranger II - Yellow",
        weapon: ["Zeo Pistol", "Zeo Blade", "Double-Clubs"],
        season_id: 2,
        joined_date: "1996-04-20",
        status: "Active",
        power_level: 90,
        location: "Angel Grove",
        gear: [
          "Wrist Communicator",
          "Zeonizer with Zeo Crystal",
          "Yellow Zeo Jet Cycle",
        ],
        zord: ["Zeo Zord Two", "Super Zeo Zord Two"],
      },
      {
        id: 13,
        user: "Jason Lee Scott",
        ranger_color: "Gold",
        ranger_designation: "Gold Zeo Ranger",
        weapon: ["Golden Power Staff"],
        season_id: 2,
        joined_date: "1996-04-20",
        status: "Active",
        power_level: 105,
        location: "Angel Grove",
        gear: ["Wrist Communicator", "Golden Shield"],
        zord: ["Pyramidas", "Warrior Wheel"],
      },
    ],
  },
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

const evaluateCondition = (
  row: PowerRanger,
  column: string,
  operator: string,
  value: string,
  table: Table
): boolean => {
  // Implementation of evaluateCondition (replace with your actual logic)
  const columnValue = row[column as keyof PowerRanger];
  const compareValue = value.replace(/^'|'$/g, "");
  const columnDef = table.columns.find(
    (col) => col.name.toLowerCase() === column.toLowerCase()
  );

  if (!columnDef) return false;

  switch (operator.toUpperCase()) {
    case "=":
      return columnValue === compareValue;
    case "!=":
      return columnValue !== compareValue;
    case ">":
      return Number(columnValue) > Number(compareValue);
    case "<":
      return Number(columnValue) < Number(compareValue);
    case ">=":
      return Number(columnValue) >= Number(compareValue);
    case "<=":
      return Number(columnValue) <= Number(compareValue);
    case "LIKE":
      const pattern = compareValue.replace(/%/g, ".*").replace(/_/g, ".");
      return new RegExp(`^${pattern}$`, "i").test(String(columnValue));
    default:
      return false;
  }
};

export default function SqlEditor() {
  const editorRef = useRef<EditorView | null>(null);
  const [result, setResult] = useState<string | null>("");
  const [viewMode, setViewMode] = useState<"json" | "table">("json");
  const [tooltip, setTooltip] = useState<string | null>("");

  const uniqueSeasons = useCallback(() => {
    const seasons = new Set<number>();
    Object.values(tables).forEach((table) => {
      table.data.forEach((row) => {
        seasons.add(row.season_id);
      });
    });
    return Array.from(seasons);
  }, []);

  const evaluateLikeCondition = (
    columnValue: string | number,
    pattern: string
  ): boolean => {
    const cleanPattern = pattern.replace(/^'|'$/g, "");
    const regex = new RegExp(
      `^${cleanPattern
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/%/g, ".*")
        .replace(/_/g, ".")}$`,
      "i"
    );
    return regex.test(String(columnValue));
  };

  const evaluateBetweenCondition = (
    row: PowerRanger,
    column: string,
    value1: string,
    value2: string,
    table: PowerRangersData
  ): boolean => {
    const columnValue = row[column as keyof PowerRanger];
    const columnType = table.columns.find(
      (col: Column) => col.name === column
    )?.type;

    const cleanValue1 = value1.replace(/^'|'$/g, "");
    const cleanValue2 = value2.replace(/^'|'$/g, "");

    let typedColumnValue: string | number;
    let typedValue1: string | number;
    let typedValue2: string | number;

    if (columnType === "integer" || columnType === "float") {
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

  const evaluateNullCondition = (
    row: PowerRanger,
    column: string,
    operator: string,
    table: PowerRangersData
  ): boolean => {
    if (!table.columns.some((col) => col.name === column)) {
      throw new Error(
        `Column '${column}' does not exist in table '${table.tableName}'`
      );
    }

    const columnValue = row[column as keyof PowerRanger];
    return operator.toUpperCase() === "IS NULL"
      ? columnValue === null || columnValue === undefined
      : columnValue !== null && columnValue !== undefined;
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
        const showTablesResult: ShowTablesResult[] = Object.keys(tables).map(
          (tableName) => ({
            table_name: tableName,
          })
        );
        setResult(JSON.stringify(showTablesResult, null, 2));
        setTooltip(null);
        return true;
      }

      const describeMatch = lowerQuery.match(/^describe\s+(\w+)\s*;?$/i);
      if (describeMatch) {
        const tableName = describeMatch[1].toLowerCase();
        const table = tables[tableName];
        if (!table) {
          setResult(`Error: Table '${tableName}' not found`);
          setTooltip(null);
          return false;
        }
        const describeResult: DescribeResult[] = table.columns.map((col) => ({
          field: col.name,
          type: col.type,
          null: col.notNull ? "NO" : "YES",
        }));
        setResult(JSON.stringify(describeResult, null, 2));
        setTooltip(null);
        return true;
      }

      const tableRegex = /from\s+(\w+)/i;
      const tableMatch = query.match(tableRegex);
      if (!tableMatch) {
        setResult(
          "Error: Query must include a valid FROM clause with a table name"
        );
        setTooltip(null);
        return false;
      }
      const tableName = tableMatch[1].toLowerCase();
      const table = tables[tableName];
      if (!table) {
        setResult(`Error: Table '${tableName}' not found`);
        setTooltip(null);
        return false;
      }

      const sumMatch = query.match(
        new RegExp(
          `^select\\s+sum\\s*\\((\\w+)\\)\\s*(?:as\\s+'([^']+)')?\\s+from\\s+${tableName}(?:\\s+where\\s+(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );
      const countMatch = query.match(
        new RegExp(
          `^select\\s+count\\s*\\(([*]|\\w+)\\)\\s*(?:as\\s+'([^']+)')?\\s+from\\s+${tableName}(?:\\s+where\\s+(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );
      const maxMatch = query.match(
        new RegExp(
          `^select\\s+max\\s*\\((\\w+)\\)\\s*(?:as\\s+'([^']+)')?\\s+from\\s+${tableName}(?:\\s+where\\s+(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );
      const minMatch = query.match(
        new RegExp(
          `^select\\s+min\\s*\\((\\w+)\\)\\s*(?:as\\s+'([^']+)')?\\s+from\\s+${tableName}(?:\\s+where\\s+(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );
      const avgMatch = query.match(
        new RegExp(
          `^select\\s+avg\\s*\\((\\w+)\\)\\s*(?:as\\s+'([^']+)')?\\s+from\\s+${tableName}(?:\\s+where\\s+(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );
      const roundMatch = query.match(
        new RegExp(
          `^select\\s+round\\s*\\((\\w+),\\s*(\\d+)\\)\\s*(?:as\\s+'([^']+)')?\\s+from\\s+${tableName}(?:\\s+where\\s+(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );
      const groupByMatch = query.match(
        new RegExp(
          `^select\\s+(.+?)\\s+from\\s+${tableName}(?:\\s+where\\s+(.+?))?(?:\\s+group\\s+by\\s+(.+?))(?:\\s+having\\s+(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );
      const selectDistinctMatch = query.match(
        new RegExp(
          `^select\\s+distinct\\s+(.+?)\\s+from\\s+${tableName}(?:\\s+where\\s+(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );
      const selectMatch = query.match(
        new RegExp(
          `^select\\s+(.+?)\\s+from\\s+${tableName}(?:\\s+where\\s+(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );

      const joinMatch = query.match(
        /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+AS\s+(\w+))?\s+INNER\s+JOIN\s+(\w+)(?:\s+AS\s+(\w+))?\s+ON\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?\s*;?$/i
      );

      if (
        !selectMatch &&
        !selectDistinctMatch &&
        !countMatch &&
        !sumMatch &&
        !maxMatch &&
        !avgMatch &&
        !roundMatch &&
        !groupByMatch &&
        !joinMatch
      ) {
        setResult(
          "Error: Query must be 'SHOW TABLES', 'DESCRIBE <table>', or a valid SELECT query with supported clauses (SELECT, DISTINCT, COUNT, SUM, MAX, MIN, AVG, ROUND, GROUP BY, HAVING, WHERE, ORDER BY, LIMIT, INNER JOIN)"
        );
        setTooltip(null);
        return false;
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
            fieldName = roundAvgMatch[1].trim();
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
              !table.columns.some(
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
          ? table.columns.map((col) => col.name)
          : nonAggregateFields;
        const invalidFields = actualFields.filter(
          (field) =>
            !table.columns.some(
              (col) => col.name.toLowerCase() === field.toLowerCase()
            )
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
            !table.columns.some(
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

        let filteredData = table.data;
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
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*|\d+(?:\.\d+)?)\s+AND\s+('[^']*'|[^' ]\w*|\d+(?:\.\d+)?)$/i
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
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*|\d+(?:\.\d+)?))?$/i
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
              !table.columns.some(
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
                      cond.operator,
                      table
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2,
                      table
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1,
                      table
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

        let resultData: Record<string, string | number | string[] | null>[] =
          [];
        for (const groupKey in groupedData) {
          const groupRows = groupedData[groupKey];
          const resultRow: Record<string, string | number | string[] | null> =
            {};

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
                const columnDef = table.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (
                  !columnDef ||
                  (columnDef.type !== "integer" && columnDef.type !== "float")
                ) {
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
                const columnDef = table.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (
                  !columnDef ||
                  (columnDef.type !== "integer" && columnDef.type !== "float")
                ) {
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
                const columnDef = table.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (
                  !columnDef ||
                  (columnDef.type !== "integer" &&
                    columnDef.type !== "float" &&
                    columnDef.type !== "date")
                ) {
                  setResult(
                    `Error: MAX can only be applied to numeric or date columns: ${column}`
                  );
                  setTooltip(null);
                  return false;
                }
                if (
                  columnDef.type === "integer" ||
                  columnDef.type === "float"
                ) {
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
                const columnDef = table.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (
                  !columnDef ||
                  (columnDef.type !== "integer" &&
                    columnDef.type !== "float" &&
                    columnDef.type !== "date")
                ) {
                  setResult(
                    `Error: MIN can only be applied to numeric or date columns: ${column}`
                  );
                  setTooltip(null);
                  return false;
                }
                if (
                  columnDef.type === "integer" ||
                  columnDef.type === "float"
                ) {
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
                const columnDef = table.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (
                  !columnDef ||
                  (columnDef.type !== "integer" && columnDef.type !== "float")
                ) {
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
                const columnDef = table.columns.find(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                );
                if (
                  !columnDef ||
                  (columnDef.type !== "integer" && columnDef.type !== "float")
                ) {
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
            /^(count|sum|max|min|avg)\s*\(([*]|\w+)\)\s*(=|\!=|>|<|>=|<=)\s*(\d+(?:\.\d+)?)$/i
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
          const columnType = table.columns.find(
            (col) => col.name.toLowerCase() === orderByColumn.toLowerCase()
          )?.type;
          const alias = fields.find(
            (f) => f.name.toLowerCase() === orderByColumn.toLowerCase()
          )?.alias;
          if (!columnType && !alias) {
            setResult(`Error: Invalid column in ORDER BY: ${orderByColumn}`);
            setTooltip(null);
            return false;
          }

          resultData.sort((a, b) => {
            const actualColumn = alias || orderByColumn;
            const aValue = a[actualColumn] ?? "";
            const bValue = b[actualColumn] ?? "";
            let comparison = 0;

            if (columnType === "integer" || columnType === "float") {
              const aNum = Number(aValue);
              const bNum = Number(bValue);
              comparison = aNum - bNum;
            } else if (columnType === "text[]") {
              const aArray = Array.isArray(aValue) ? aValue : [];
              const bArray = Array.isArray(bValue) ? bValue : [];
              comparison = aArray.join(",").localeCompare(bArray.join(","));
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

      if (joinMatch) {
        const [
          ,
          rawFields,
          firstTableName,
          firstTableAlias,
          secondTableName,
          secondTableAlias,
          leftTableOrAlias,
          leftColumn,
          rightTableOrAlias,
          rightColumn,
          whereClause,
          orderByColumn,
          orderByDirection = "ASC",
          limitValue,
        ] = joinMatch;

        const effectiveFirstTableName = firstTableAlias || firstTableName;
        const effectiveSecondTableName = secondTableAlias || secondTableName;

        const tableMap = {
          [effectiveFirstTableName.toLowerCase()]: firstTableName.toLowerCase(),
          [effectiveSecondTableName.toLowerCase()]:
            secondTableName.toLowerCase(),
        };

        const firstTable = tables[firstTableName.toLowerCase()];
        const secondTable = tables[secondTableName.toLowerCase()];

        if (!firstTable || !secondTable) {
          setResult(
            `Error: Table '${
              !firstTable ? firstTableName : secondTableName
            }' not found`
          );
          setTooltip(null);
          return false;
        }

        const leftTableCols = firstTable.columns.map((col) =>
          col.name.toLowerCase()
        );
        const rightTableCols = secondTable.columns.map((col) =>
          col.name.toLowerCase()
        );

        const leftTableName =
          tableMap[leftTableOrAlias.toLowerCase()] ||
          leftTableOrAlias.toLowerCase();
        const rightTableName =
          tableMap[rightTableOrAlias.toLowerCase()] ||
          rightTableOrAlias.toLowerCase();

        const isLeftFirstTable = leftTableName === firstTableName.toLowerCase();
        const isRightFirstTable =
          rightTableName === firstTableName.toLowerCase();

        if (
          (isLeftFirstTable &&
            !leftTableCols.includes(leftColumn.toLowerCase())) ||
          (!isLeftFirstTable &&
            !rightTableCols.includes(leftColumn.toLowerCase()))
        ) {
          setResult(
            `Error: Invalid column in ON clause: ${leftTableOrAlias}.${leftColumn}`
          );
          setTooltip(null);
          return false;
        }

        if (
          (isRightFirstTable &&
            !leftTableCols.includes(rightColumn.toLowerCase())) ||
          (!isRightFirstTable &&
            !rightTableCols.includes(rightColumn.toLowerCase()))
        ) {
          setResult(
            `Error: Invalid column in ON clause: ${rightTableOrAlias}.${rightColumn}`
          );
          setTooltip(null);
          return false;
        }

        const fields: Array<{
          name: string;
          table: string;
          alias?: string;
        }> = [];
        const rawFieldsWithAliases = rawFields
          .split(/(?<!\([^()]*),(?![^()]*\))/)
          .map((f) => f.trim())
          .filter((f) => f);

        for (const field of rawFieldsWithAliases) {
          const asMatch = field.match(/^(.+?)\s+AS\s+(?:(['])(.*?)\2|(\w+))$/i);
          let fieldName = field;
          let alias: string | undefined;
          if (asMatch) {
            fieldName = asMatch[1].trim();
            alias = asMatch[3] || asMatch[4];
          }

          const fieldMatch = fieldName.match(/^(\w+)\.(\w+)$/i);
          if (!fieldMatch && fieldName !== "*") {
            setResult(
              `Error: Field must be in format table.column or *: ${fieldName}`
            );
            setTooltip(null);
            return false;
          }

          if (fieldName === "*") {
            firstTable.columns.forEach((col) => {
              fields.push({
                name: col.name,
                table: effectiveFirstTableName,
                alias: undefined,
              });
            });
            secondTable.columns.forEach((col) => {
              fields.push({
                name: col.name,
                table: effectiveSecondTableName,
                alias: undefined,
              });
            });
          } else if (fieldMatch) {
            const [, tableOrAlias, columnName] = fieldMatch;
            const actualTableName =
              tableMap[tableOrAlias.toLowerCase()] ||
              tableOrAlias.toLowerCase();
            if (
              ![
                firstTableName.toLowerCase(),
                secondTableName.toLowerCase(),
              ].includes(actualTableName)
            ) {
              setResult(`Error: Invalid table in field: ${tableOrAlias}`);
              setTooltip(null);
              return false;
            }
            const table = tables[actualTableName];
            if (
              !table.columns.some(
                (col) => col.name.toLowerCase() === columnName.toLowerCase()
              )
            ) {
              setResult(
                `Error: Invalid column in field: ${tableOrAlias}.${columnName}`
              );
              setTooltip(null);
              return false;
            }
            fields.push({
              name: columnName,
              table: tableOrAlias,
              alias,
            });
          }
        }

        let resultData: Array<
          Record<string, string | number | string[] | null>
        > = [];
        firstTable.data.forEach((leftRow) => {
          secondTable.data.forEach((rightRow) => {
            const leftValue = leftRow[leftColumn as keyof PowerRanger];
            const rightValue = rightRow[rightColumn as keyof PowerRanger];
            if (leftValue === rightValue) {
              const resultRow: Record<
                string,
                string | number | string[] | null
              > = {};
              fields.forEach((field) => {
                const actualTableName =
                  tableMap[field.table.toLowerCase()] ||
                  field.table.toLowerCase();
                const table = tables[actualTableName];
                const key = field.alias || `${field.table}.${field.name}`;
                resultRow[key] = table.data.find(
                  (row) =>
                    row.id ===
                    (actualTableName === firstTableName.toLowerCase()
                      ? leftRow.id
                      : rightRow.id)
                )![field.name as keyof PowerRanger];
              });
              resultData.push(resultRow);
            }
          });
        });

        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            column: string;
            table: string;
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
                /^(\w+)\.(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*|\d+(?:\.\d+)?)\s+AND\s+('[^']*'|[^' ]\w*|\d+(?:\.\d+)?)$/i
              );
              const conditionMatch = part.match(
                /^(\w+)\.(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*|\d+(?:\.\d+)?))?$/i
              );
              if (betweenMatch) {
                const [, tableOrAlias, column, value1, value2] = betweenMatch;
                conditions.push({
                  table: tableOrAlias,
                  column,
                  operator: "BETWEEN",
                  value1,
                  value2,
                });
              } else if (conditionMatch) {
                const [, tableOrAlias, column, operator, value1] =
                  conditionMatch;
                conditions.push({
                  table: tableOrAlias,
                  column,
                  operator,
                  value1,
                });
              } else {
                setResult(`Error: Invalid condition in WHERE clause: ${part}`);
                setTooltip(null);
                return false;
              }
            } else {
              joinOperators.push(conditionParts[i].toUpperCase());
            }
          }

          for (let i = 0; i < conditions.length - 1; i++) {
            conditions[i].join = joinOperators[i] as "AND" | "OR";
          }

          for (const condition of conditions) {
            const { table: tableOrAlias, column } = condition;
            const actualTableName =
              tableMap[tableOrAlias.toLowerCase()] ||
              tableOrAlias.toLowerCase();
            if (
              !tables[actualTableName] ||
              !tables[actualTableName].columns.some(
                (col) => col.name.toLowerCase() === column.toLowerCase()
              )
            ) {
              setResult(
                `Error: Invalid column in WHERE clause: ${tableOrAlias}.${column}`
              );
              setTooltip(null);
              return false;
            }
          }

          resultData = resultData.filter((row) => {
            let result = true;
            let currentGroup: Array<{
              table: string;
              column: string;
              operator: string;
              value1?: string;
              value2?: string;
            }> = [];
            let lastJoin: "AND" | "OR" | null = null;

            for (const condition of conditions) {
              const {
                table: tableOrAlias,
                column,
                operator,
                value1,
                value2,
                join,
              } = condition;
              currentGroup.push({
                table: tableOrAlias,
                column,
                operator,
                value1,
                value2,
              });

              if (
                join ||
                conditions.indexOf(condition) === conditions.length - 1
              ) {
                const groupResult = currentGroup.every((cond) => {
                  const actualTableName =
                    tableMap[cond.table.toLowerCase()] ||
                    cond.table.toLowerCase();
                  const tableData = tables[actualTableName];
                  const columnDef = tableData.columns.find(
                    (col) =>
                      col.name.toLowerCase() === cond.column.toLowerCase()
                  );
                  const key =
                    fields.find(
                      (f) =>
                        f.table.toLowerCase() === cond.table.toLowerCase() &&
                        f.name.toLowerCase() === cond.column.toLowerCase()
                    )?.alias || `${cond.table}.${cond.column}`;
                  const value = row[key];

                  if (
                    ["IS NULL", "IS NOT NULL"].includes(
                      cond.operator.toUpperCase()
                    )
                  ) {
                    return cond.operator.toUpperCase() === "IS NULL"
                      ? value === null
                      : value !== null;
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    const val1 = cond.value1.replace(/^'|'$/g, "");
                    const val2 = cond.value2.replace(/^'|'$/g, "");
                    if (
                      columnDef?.type === "integer" ||
                      columnDef?.type === "float"
                    ) {
                      return (
                        Number(value) >= Number(val1) &&
                        Number(value) <= Number(val2)
                      );
                    } else {
                      return String(value) >= val1 && String(value) <= val2;
                    }
                  } else {
                    if (!cond.value1) return false;
                    const compareValue = cond.value1.replace(/^'|'$/g, "");
                    if (cond.operator.toUpperCase() === "LIKE") {
                      const pattern = compareValue
                        .replace(/%/g, ".*")
                        .replace(/_/g, ".");
                      return new RegExp(`^${pattern}$`, "i").test(
                        String(value)
                      );
                    }
                    if (
                      columnDef?.type === "integer" ||
                      columnDef?.type === "float"
                    ) {
                      const numValue = Number(value);
                      const numCompare = Number(compareValue);
                      switch (cond.operator) {
                        case "=":
                          return numValue === numCompare;
                        case "!=":
                          return numValue !== numCompare;
                        case ">":
                          return numValue > numCompare;
                        case "<":
                          return numValue < numCompare;
                        case ">=":
                          return numValue >= numCompare;
                        case "<=":
                          return numValue <= numCompare;
                        default:
                          return false;
                      }
                    } else {
                      switch (cond.operator) {
                        case "=":
                          return String(value) === compareValue;
                        case "!=":
                          return String(value) !== compareValue;
                        case ">":
                          return String(value) > compareValue;
                        case "<":
                          return String(value) < compareValue;
                        case ">=":
                          return String(value) >= compareValue;
                        case "<=":
                          return String(value) <= compareValue;
                        default:
                          return false;
                      }
                    }
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

        if (orderByColumn) {
          const field = fields.find(
            (f) =>
              f.name.toLowerCase() === orderByColumn.toLowerCase() ||
              f.alias?.toLowerCase() === orderByColumn.toLowerCase()
          );
          if (!field) {
            setResult(`Error: Invalid column in ORDER BY: ${orderByColumn}`);
            setTooltip(null);
            return false;
          }
          const actualTableName =
            tableMap[field.table.toLowerCase()] || field.table.toLowerCase();
          const table = tables[actualTableName];
          const columnType = table.columns.find(
            (col) => col.name.toLowerCase() === field.name.toLowerCase()
          )?.type;

          resultData.sort((a, b) => {
            const key = field.alias || `${field.table}.${field.name}`;
            const aValue = a[key] ?? "";
            const bValue = b[key] ?? "";
            let comparison = 0;

            if (columnType === "integer" || columnType === "float") {
              const aNum = Number(aValue);
              const bNum = Number(bValue);
              comparison = aNum - bNum;
            } else if (columnType === "text[]") {
              const aArray = Array.isArray(aValue) ? aValue : [];
              const bArray = Array.isArray(bValue) ? bValue : [];
              comparison = aArray.join(",").localeCompare(bArray.join(","));
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
          setTooltip(null);
          return true;
        } catch {
          setResult("Error: Failed to generate valid JSON output");
          setTooltip(null);
          return false;
        }
      }

      const handleAggregate = (
        match: RegExpMatchArray,
        aggregateType: string,
        column: string,
        alias: string,
        whereClause?: string,
        orderByColumn?: string,
        orderByDirection: string = "ASC",
        limitValue?: string
      ): boolean => {
        let filteredData = table.data;

        if (aggregateType !== "count" || column !== "*") {
          const columnDef = table.columns.find(
            (col) => col.name.toLowerCase() === column.toLowerCase()
          );
          if (!columnDef) {
            setResult(
              `Error: Invalid column in ${aggregateType.toUpperCase()}: ${column}`
            );
            setTooltip(null);
            return false;
          }
          if (
            (["sum", "avg", "round"].includes(aggregateType) &&
              columnDef.type !== "integer" &&
              columnDef.type !== "float") ||
            (["max", "min"].includes(aggregateType) &&
              columnDef.type !== "integer" &&
              columnDef.type !== "float" &&
              columnDef.type !== "date")
          ) {
            setResult(
              `Error: ${aggregateType.toUpperCase()} can only be applied to ${
                aggregateType === "max" || aggregateType === "min"
                  ? "numeric or date"
                  : "numeric"
              } columns: ${column}`
            );
            setTooltip(null);
            return false;
          }
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
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*|\d+(?:\.\d+)?)\s+AND\s+('[^']*'|[^' ]\w*|\d+(?:\.\d+)?)$/i
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
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*|\d+(?:\.\d+)?))?$/i
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
              !table.columns.some(
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
                      cond.operator,
                      table
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2,
                      table
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1,
                      table
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

        let resultData: Record<string, string | number | string[] | null>[] =
          [];
        if (aggregateType === "sum") {
          const sum = filteredData.reduce((acc, row) => {
            const value = Number(row[column as keyof PowerRanger]);
            return isNaN(value) ? acc : acc + value;
          }, 0);
          resultData = [{ [alias]: sum }];
        } else if (aggregateType === "count") {
          const count =
            column === "*"
              ? filteredData.length
              : filteredData.filter(
                  (row) =>
                    row[column as keyof PowerRanger] !== null &&
                    row[column as keyof PowerRanger] !== undefined
                ).length;
          resultData = [{ [alias]: count }];
        } else if (aggregateType === "max") {
          const columnDef = table.columns.find(
            (col) => col.name.toLowerCase() === column.toLowerCase()
          );
          let max: number | string | null = null;
          if (columnDef?.type === "integer" || columnDef?.type === "float") {
            max = filteredData.reduce((acc, row) => {
              const value = Number(row[column as keyof PowerRanger]);
              return isNaN(value)
                ? acc
                : Math.max(acc || Number.NEGATIVE_INFINITY, value);
            }, null as number | null);
          } else if (columnDef?.type === "date") {
            max = filteredData.reduce((acc, row) => {
              const value = String(row[column as keyof PowerRanger]);
              return acc === null || value > acc ? value : acc;
            }, null as string | null);
          }
          if (max === null) {
            setResult(`Error: No valid values found for MAX(${column})`);
            setTooltip(null);
            return false;
          }
          resultData = [{ [alias]: max }];
        } else if (aggregateType === "min") {
          const columnDef = table.columns.find(
            (col) => col.name.toLowerCase() === column.toLowerCase()
          );
          let min: number | string | null = null;
          if (columnDef?.type === "integer" || columnDef?.type === "float") {
            min = filteredData.reduce((acc, row) => {
              const value = Number(row[column as keyof PowerRanger]);
              return isNaN(value)
                ? acc
                : Math.min(acc || Number.POSITIVE_INFINITY, value);
            }, null as number | null);
          } else if (columnDef?.type === "date") {
            min = filteredData.reduce((acc, row) => {
              const value = String(row[column as keyof PowerRanger]);
              return acc === null || value < acc ? value : acc;
            }, null as string | null);
          }
          if (min === null) {
            setResult(`Error: No valid values found for MIN(${column})`);
            setTooltip(null);
            return false;
          }
          resultData = [{ [alias]: min }];
        } else if (aggregateType === "avg") {
          const values = filteredData
            .map((row) => Number(row[column as keyof PowerRanger]))
            .filter((value) => !isNaN(value));
          const avg =
            values.length > 0
              ? values.reduce((acc, val) => acc + val, 0) / values.length
              : null;
          if (avg === null) {
            setResult(`Error: No valid values found for AVG(${column})`);
            setTooltip(null);
            return false;
          }
          resultData = [{ [alias]: avg }];
        } else if (aggregateType === "round") {
          const decimalPlaces = parseInt(match[2], 10);
          if (isNaN(decimalPlaces) || decimalPlaces < 0) {
            setResult(
              "Error: ROUND requires a non-negative integer for decimal places"
            );
            setTooltip(null);
            return false;
          }
          resultData = filteredData.map((row) => {
            const value = Number(row[column as keyof PowerRanger]);
            if (isNaN(value)) {
              return { [alias]: null };
            }
            return { [alias]: Number(value.toFixed(decimalPlaces)) };
          });
        }

        if (orderByColumn) {
          const columnType = table.columns.find(
            (col) => col.name.toLowerCase() === orderByColumn.toLowerCase()
          )?.type;
          if (!columnType) {
            setResult(`Error: Invalid column in ORDER BY: ${orderByColumn}`);
            setTooltip(null);
            return false;
          }

          resultData.sort((a, b) => {
            const aValue = a[alias] ?? "";
            const bValue = b[alias] ?? "";
            let comparison = 0;

            if (columnType === "integer" || columnType === "float") {
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
      };

      if (sumMatch) {
        if (lowerQuery.includes("group by")) {
          setResult(
            "Error: SUM with GROUP BY not supported in this format; use GROUP BY syntax"
          );
          setTooltip(null);
          return false;
        }
        const [
          ,
          column,
          alias = "sum",
          whereClause,
          ,
          orderByDirection,
          limitValue,
        ] = sumMatch;
        return handleAggregate(
          sumMatch,
          "sum",
          column,
          alias,
          whereClause,
          column,
          orderByDirection,
          limitValue
        );
      }

      if (countMatch) {
        const [
          ,
          column,
          alias = "count",
          whereClause,
          ,
          orderByDirection,
          limitValue,
        ] = countMatch;
        return handleAggregate(
          countMatch,
          "count",
          column,
          alias,
          whereClause,
          column,
          orderByDirection,
          limitValue
        );
      }

      if (maxMatch) {
        const [
          ,
          column,
          alias = "max",
          whereClause,
          ,
          orderByDirection,
          limitValue,
        ] = maxMatch;
        return handleAggregate(
          maxMatch,
          "max",
          column,
          alias,
          whereClause,
          column,
          orderByDirection,
          limitValue
        );
      }

      if (minMatch) {
        const [
          ,
          column,
          alias = "min",
          whereClause,
          ,
          orderByDirection,
          limitValue,
        ] = minMatch;
        return handleAggregate(
          minMatch,
          "min",
          column,
          alias,
          whereClause,
          column,
          orderByDirection,
          limitValue
        );
      }

      if (avgMatch) {
        const [
          ,
          column,
          alias = "avg",
          whereClause,
          ,
          orderByDirection,
          limitValue,
        ] = avgMatch;
        return handleAggregate(
          avgMatch,
          "avg",
          column,
          alias,
          whereClause,
          column,
          orderByDirection,
          limitValue
        );
      }

      if (roundMatch) {
        const [
          ,
          column,
          ,
          alias = "round",
          whereClause,
          ,
          orderByDirection,
          limitValue,
        ] = roundMatch;
        return handleAggregate(
          roundMatch,
          "round",
          column,
          alias,
          whereClause,
          column,
          orderByDirection,
          limitValue
        );
      }

      if (selectMatch || selectDistinctMatch) {
        const isDistinct = !!selectDistinctMatch;
        const match = selectDistinctMatch || selectMatch;
        if (!match || !match[1]) {
          setResult("Error: Invalid SELECT query format");
          setTooltip(null);
          return false;
        }

        const rawFieldsWithAliases = match[1]
          .split(/(?<!\([^()]*),(?![^()]*\))/)
          .map((f) => f.trim());
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

        const fields: Array<{
          name: string;
          alias?: string;
          isCase?: boolean;
          caseConditions?: Array<{
            column: string;
            operator: string;
            value1?: string;
            value2?: string;
            output: string;
          }>;
          elseOutput?: string;
        }> = [];
        const aliases: { [key: string]: string } = {};

        for (const field of rawFieldsWithAliases) {
          const asMatch = field.match(/^(.+?)\s+as\s+'([^']+)'\s*$/i);
          let fieldName = field;
          let alias: string | undefined;
          let isCase = false;
          const caseConditions: Array<{
            column: string;
            operator: string;
            value1?: string;
            value2?: string;
            output: string;
          }> = [];
          let elseOutput: string | undefined;

          if (asMatch) {
            fieldName = asMatch[1].trim();
            alias = asMatch[2];
          }

          const caseMatch = fieldName.match(
            /^case\s+((?:when\s+\w+\s*(?:=|\!=|>|<|>=|<=|LIKE|BETWEEN)\s*(?:'[^']*'|[^' ]\w*|\d+(?:\.\d+)?)\s*(?:and\s*(?:'[^']*'|[^' ]\w*|\d+(?:\.\d+)?)\s*)?then\s*(?:'[^']*'|[^' ]\w*|\d+(?:\.\d+)?)\s*)+)(?:else\s*(?:'[^']*'|[^' ]\w*|\d+(?:\.\d+)?))?\s*end$/i
          );

          if (caseMatch) {
            isCase = true;
            const caseClause = caseMatch[1];
            const elseMatch = fieldName.match(
              /else\s*(?:'([^']*)'|([^' ]\w*|\d+(?:\.\d+)?))/i
            );
            if (elseMatch) {
              elseOutput = elseMatch[1] || elseMatch[2];
            }

            const whenMatches = caseClause.matchAll(
              /when\s+(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|BETWEEN)\s*(?:('[^']*'|[^' ]\w*|\d+(?:\.\d+)?))(?:\s+and\s*(?:('[^']*'|[^' ]\w*|\d+(?:\.\d+)?)))?\s*then\s*(?:('[^']*'|[^' ]\w*|\d+(?:\.\d+)?))/gi
            );

            for (const whenMatch of whenMatches) {
              const [, column, operator, value1, value2, output] = whenMatch;
              if (
                !table.columns.some(
                  (col) => col.name.toLowerCase() === column.toLowerCase()
                )
              ) {
                setResult(`Error: Invalid column in CASE WHEN: ${column}`);
                setTooltip(null);
                return false;
              }
              caseConditions.push({
                column,
                operator: operator.toUpperCase(),
                value1: value1.replace(/^'|'$/g, ""),
                value2: value2 ? value2.replace(/^'|'$/g, "") : undefined,
                output: output.replace(/^'|'$/g, ""),
              });
            }

            fields.push({
              name: fieldName,
              alias: alias || "case_result",
              isCase,
              caseConditions,
              elseOutput,
            });
          } else {
            if (
              fieldName !== "*" &&
              !table.columns.some(
                (col) => col.name.toLowerCase() === fieldName.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid field: ${fieldName}`);
              setTooltip(null);
              return false;
            }
            fields.push({ name: fieldName, alias: alias || fieldName });
            if (fieldName !== "*") {
              aliases[fieldName.toLowerCase()] = alias || fieldName;
            }
          }
        }

        const uniqueFields = new Set(fields.map((f) => f.name));
        if (uniqueFields.size !== fields.length) {
          setResult("Error: Duplicate field names are not allowed");
          setTooltip(null);
          return false;
        }

        if (
          fields.some((f) => !f.isCase && f.name === "*" && fields.length > 1)
        ) {
          setResult("Error: Cannot mix * with specific fields");
          setTooltip(null);
          return false;
        }

        const actualFields = fields
          .filter((f) => !f.isCase)
          .map((f) => f.name)
          .flatMap((f) =>
            f === "*" ? table.columns.map((col) => col.name) : [f]
          );
        const invalidFields = actualFields.filter(
          (field) =>
            !table.columns.some(
              (col) => col.name.toLowerCase() === field.toLowerCase()
            )
        );
        if (invalidFields.length > 0) {
          setResult(`Error: Invalid field(s): ${invalidFields.join(", ")}`);
          setTooltip(null);
          return false;
        }

        let filteredData = table.data;
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
                /^(\w+)\s+BETWEEN\s+('[^']*'|[^' ]\w*|\d+(?:\.\d+)?)\s+AND\s+('[^']*'|[^' ]\w*|\d+(?:\.\d+)?)$/i
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
                  /^(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|IS NULL|IS NOT NULL)\s*(?:('[^']*'|[^' ]\w*|\d+(?:\.\d+)?))?$/i
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
              !table.columns.some(
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
                      cond.operator,
                      table
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2,
                      table
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1,
                      table
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

        let resultData: Array<
          Partial<PowerRanger> & {
            [key: string]: string | number | string[] | null;
          }
        > = filteredData.map((row) => {
          const resultRow: Partial<PowerRanger> & {
            [key: string]: string | number | string[] | null;
          } = {};

          fields.forEach((field) => {
            if (field.isCase) {
              let caseResult: string | null = field.elseOutput || null;
              for (const condition of field.caseConditions || []) {
                let conditionMet = false;
                if (condition.operator === "BETWEEN") {
                  if (condition.value1 && condition.value2) {
                    conditionMet = evaluateBetweenCondition(
                      row,
                      condition.column,
                      condition.value1,
                      condition.value2,
                      table
                    );
                  }
                } else if (
                  ["IS NULL", "IS NOT NULL"].includes(condition.operator)
                ) {
                  conditionMet = evaluateNullCondition(
                    row,
                    condition.column,
                    condition.operator,
                    table
                  );
                } else {
                  if (condition.value1) {
                    conditionMet = evaluateCondition(
                      row,
                      condition.column,
                      condition.operator,
                      condition.value1,
                      table
                    );
                  }
                }
                if (conditionMet) {
                  caseResult = condition.output;
                  break;
                }
              }
              resultRow[field.alias || "case_result"] = caseResult;
            } else if (field.name === "*") {
              table.columns.forEach((col) => {
                resultRow[col.name] = row[col.name as keyof PowerRanger];
              });
            } else {
              resultRow[field.alias || field.name] =
                row[field.name as keyof PowerRanger];
            }
          });

          return resultRow;
        });

        if (isDistinct) {
          const seen = new Set<string>();
          resultData = resultData.filter((row) => {
            const key = JSON.stringify(
              Object.keys(row)
                .sort()
                .reduce((obj, key) => {
                  obj[key] = row[key];
                  return obj;
                }, {} as Record<string, string | number | string[] | null>)
            );
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });

          if (fields.length > 1) {
            const groupByFields = fields.map(
              (field) => field.alias || field.name
            );
            setTooltip(
              `SELECT DISTINCT ${groupByFields.join(
                ", "
              )} FROM ${tableName} is roughly equivalent to: SELECT ${groupByFields.join(
                ", "
              )} FROM ${tableName} GROUP BY ${groupByFields.join(", ")}`
            );
            setTimeout(() => setTooltip(null), 5000);
          } else {
            setTooltip(null);
          }
        }
        if (orderByColumn) {
          const columnType = table.columns.find(
            (col) => col.name.toLowerCase() === orderByColumn.toLowerCase()
          )?.type;
          const alias = aliases[orderByColumn.toLowerCase()];
          if (!columnType && !alias) {
            setResult(`Error: Invalid column in ORDER BY: ${orderByColumn}`);
            setTooltip(null);
            return false;
          }

          resultData.sort((a, b) => {
            const actualColumn = alias || orderByColumn;
            const aValue = a[actualColumn] ?? "";
            const bValue = b[actualColumn] ?? "";
            let comparison = 0;

            if (columnType === "integer" || columnType === "float") {
              const aNum = Number(aValue);
              const bNum = Number(bValue);
              comparison = aNum - bNum;
            } else if (columnType === "text[]") {
              const aArray = Array.isArray(aValue) ? aValue : [];
              const bArray = Array.isArray(bValue) ? bValue : [];
              comparison = aArray.join(",").localeCompare(bArray.join(","));
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
        setTooltip(null);
        return true;
      }

      setResult("Error: Invalid query format");
      setTooltip(null);
      return false;
    },
    [setResult, setTooltip, evaluateCondition]
  );

  const completion = (ctx: CompletionContext) => {
    const word = ctx.matchBefore(/[\w*']*|^/);
    const docText = ctx.state.doc.toString().toLowerCase();
    const fullDocText = ctx.state.doc.toString();
    const cursorPos = ctx.pos;

    const getColumnOptions = (
      alreadySelectedFields: string[],
      targetTable: Table,
      tableAlias: string | null = null
    ): CompletionOption[] => {
      const prefix = tableAlias || targetTable.tableName;
      return targetTable.columns
        .filter(
          (col) => !alreadySelectedFields.includes(col.name.toLowerCase())
        )
        .map((col) => ({
          label: `${prefix}.${col.name}`,
          type: "field",
          apply: `${prefix}.${col.name} `,
          detail: `${col.type}, ${col.notNull ? "not null" : "nullable"}`,
        }));
    };

    const getUniqueValues = useCallback(
      (
        column: keyof PowerRanger,
        columnType: string,
        table: Table
      ): string[] => {
        const values = new Set<string>();
        table.data?.forEach((row) => {
          const value = row[column];
          if (Array.isArray(value)) {
            value.forEach((v) => values.add(`'${v}'`));
          } else if (value !== null && value !== undefined) {
            values.add(
              columnType === "text" || columnType === "date"
                ? `'${value}'`
                : value.toString()
            );
          }
        });
        return Array.from(values).slice(0, 10);
      },
      []
    );

    const getLikePatternSuggestions = useCallback(
      (table: Table, column: keyof PowerRanger): string[] => {
        const values = getUniqueValues(
          column,
          table.columns.find((col) => col.name === column)?.type || "text",
          table
        );
        return values.map((value) => `%${value.replace(/^'|'$/g, "")}%`);
      },
      [getUniqueValues]
    );

    const formatColumnName = (name: string): string => {
      return name
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "");
    };

    const getUsedColumnsInWhere = (
      whereClause: string,
      table: Table
    ): string[] => {
      const columns = new Set<string>();
      const columnNames = table.columns.map((col) => col.name.toLowerCase());
      whereClause.split(/\s+(and|or)\s+/i).forEach((condition) => {
        columnNames.forEach((col) => {
          if (new RegExp(`\\b${col}\\b`, "i").test(condition)) {
            columns.add(col);
          }
        });
      });
      return Array.from(columns);
    };

    const tableMatch = fullDocText.match(/from\s+(\w+)/i);
    const tableName = tableMatch ? tableMatch[1].toLowerCase() : null;
    const table: Table =
      tableName && tables[tableName]
        ? tables[tableName]
        : tables["mighty_morphin_power_rangers"];

    if (!table) {
      return null;
    }

    const selectMatch = fullDocText
      .substring(0, cursorPos)
      .match(
        /^select\s+(?:distinct\s+|(?:(?:count|sum|max|min|avg|round|case)\s*\([\w*]+(?:,\s*\d+)?\)\s*(?:as\s+'.*?'\s*)?,)*)?(.+?)?(?:\s+from|$)/i
      );

    const alreadySelectedFields: string[] =
      selectMatch && selectMatch[1]
        ? selectMatch[1]
            .split(/(?<!\([^()]*),(?![^()]*\))/)
            .map((f) =>
              f
                .trim()
                .replace(/\s+as\s+'.*?'$/i, "")
                .replace(/^round\s*\(\s*avg\s*\(\w+\)\s*(?:,\s*\d+)?\)$/i, "$1")
                .replace(/^case\s+.*?\s+end$/i, "")
                .toLowerCase()
            )
            .filter((f) => f)
        : [];

    const selectFields: { field: string; index: number }[] =
      selectMatch && selectMatch[1]
        ? selectMatch[1]
            .split(/(?<!\([^()]*),(?![^()]*\))/)
            .map((f) => f.trim())
            .filter((f) => f)
            .map((f, index) => ({ field: f, index: index + 1 }))
        : [];

    const getAggregateOptions = (targetTable: Table): CompletionOption[] => [
      {
        label: "COUNT(*)",
        type: "function",
        apply: "COUNT(*) ",
        detail: "Count all rows",
      },
      ...targetTable.columns.map((col) => ({
        label: `COUNT(${col.name})`,
        type: "function",
        apply: `COUNT(${col.name}) `,
        detail: `Count non-null values in ${col.name}`,
      })),
      ...targetTable.columns
        .filter((col) => col.type === "integer" || col.type === "float")
        .map((col) => ({
          label: `SUM(${col.name})`,
          type: "function",
          apply: `SUM(${col.name}) `,
          detail: `Sum values in ${col.name}`,
        })),
      ...targetTable.columns
        .filter(
          (col) =>
            col.type === "integer" ||
            col.type === "float" ||
            col.type === "date"
        )
        .map((col) => ({
          label: `MAX(${col.name})`,
          type: "function",
          apply: `MAX(${col.name}) `,
          detail: `Maximum value in ${col.name}`,
        })),
      ...targetTable.columns
        .filter(
          (col) =>
            col.type === "integer" ||
            col.type === "float" ||
            col.type === "date"
        )
        .map((col) => ({
          label: `MIN(${col.name})`,
          type: "function",
          apply: `MIN(${col.name}) `,
          detail: `Minimum value in ${col.name}`,
        })),
      ...targetTable.columns
        .filter((col) => col.type === "integer" || col.type === "float")
        .map((col) => ({
          label: `AVG(${col.name})`,
          type: "function",
          apply: `AVG(${col.name}) `,
          detail: `Average value in ${col.name}`,
        })),
      ...targetTable.columns
        .filter((col) => col.type === "integer" || col.type === "float")
        .map((col) => ({
          label: `ROUND(${col.name}, `,
          type: "function",
          apply: `ROUND(${col.name}, `,
          detail: `Round values in ${col.name} to specified decimals`,
        })),
      ...targetTable.columns
        .filter((col) => col.type === "integer" || col.type === "float")
        .map((col) => ({
          label: `ROUND(AVG(${col.name}), `,
          type: "function",
          apply: `ROUND(AVG(${col.name}), `,
          detail: `Round average of ${col.name} to specified decimals`,
        })),
    ];

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

    // 2. After DESCRIBE, suggest table names
    if (/^describe\s*$/i.test(docText)) {
      return {
        from: word?.from ?? cursorPos,
        options: Object.keys(tables).map((tableName) => ({
          label: tableName,
          type: "table",
          apply: tableName,
          detail: "Table name",
        })),
      };
    }

    // 3. After SELECT, suggest columns, *, COUNT(*), COUNT(column), SUM(column), MAX(column), MIN(column), AVG(column), ROUND(column, decimals), DISTINCT
    if (/^select\s*$/i.test(docText)) {
      const options: CompletionOption[] = getColumnOptions(
        alreadySelectedFields,
        table
      );
      options.unshift(
        { label: "*", type: "field", detail: "all columns", apply: "*" },
        {
          label: "DISTINCT",
          type: "keyword",
          apply: "DISTINCT ",
          detail: "Select unique values",
        },
        {
          label: "CASE",
          type: "keyword",
          apply: "CASE ",
          detail: "Conditional logic",
        },
        ...getAggregateOptions(table)
      );
      return { from: word?.from ?? cursorPos, options };
    }

    // 4. After SELECT DISTINCT, suggest columns
    if (/^select\s+distinct\s*$/i.test(docText)) {
      return {
        from: word?.from ?? cursorPos,
        options: getColumnOptions(alreadySelectedFields, table),
      };
    }

    // 5. After comma in SELECT, suggest remaining columns and aggregates
    if (
      /^select\s+(?:distinct\s+)?[\w\s,'*]+$/i.test(docText) &&
      /,\s*$/.test(docText.substring(0, cursorPos)) &&
      !docText.includes("from")
    ) {
      const options: CompletionOption[] = getColumnOptions(
        alreadySelectedFields,
        table
      );
      options.push(
        {
          label: "CASE",
          type: "keyword",
          apply: "CASE ",
          detail: "Conditional logic",
        },
        ...getAggregateOptions(table)
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
        const lastFieldClean = lastField.replace(/\s+as\s+'.*?'$/i, "").trim();
        const isAggregate =
          /^(count|sum|max|min|avg|round)\s*\((?:[\w*]+|\*|\([^)]+\))(?:,\s*\d+)?\)$/i.test(
            lastFieldClean
          );
        const isNestedAggregate =
          /^round\s*\(\s*avg\s*\(\w+\)\s*(?:,\s*\d+)?\)$/i.test(lastFieldClean);
        const isColumn =
          lastFieldClean.toLowerCase() === "*" ||
          table.columns.some(
            (col) => col.name.toLowerCase() === lastFieldClean.toLowerCase()
          );
        const hasAlias = /\s+as\s+'.*?'$/i.test(lastField);

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

          const options: CompletionOption[] = [
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

    // 8. After FROM, suggest table names
    if (/from\s*$/i.test(docText)) {
      return {
        from: word?.from ?? cursorPos,
        options: Object.keys(tables).map((tableName) => ({
          label: tableName,
          type: "table",
          apply: tableName + " ",
          detail: "Table name",
        })),
      };
    }

    // 9. After FROM table_name, suggest INNER JOIN, WHERE, GROUP BY, ORDER BY, or LIMIT
    if (
      new RegExp(`from\\s+(\\w+)(?:\\s+\\w+)?\\s*$`, "i").test(docText) &&
      !/inner\s+join\s*$/i.test(docText)
    ) {
      const tableNameMatch = docText.match(/from\s+(\w+)(?:\s+\w+)?\s*$/i);
      if (tableNameMatch) {
        const tableName = tableNameMatch[1].toLowerCase();
        if (tables[tableName]) {
          return {
            from: word?.from ?? cursorPos,
            options: [
              {
                label: "INNER JOIN",
                type: "keyword",
                apply: "INNER JOIN ",
                detail: "Join with another table, returning matching rows",
              },
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
      }
    }

    // 10. After GROUP BY, suggest columns or numeric references
    if (/group\s+by\s*$/i.test(docText)) {
      return {
        from: word?.from ?? cursorPos,
        options: [
          ...getColumnOptions(alreadySelectedFields, table),
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
    if (/group\s+by\s+(?:\w+|\d+)(?:\s*,\s*(?:\w+|\d+))*\s*$/i.test(docText)) {
      const groupByMatch = docText.match(/group\s+by\s+(.+)/i);
      const usedFields = groupByMatch
        ? groupByMatch[1]
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f)
        : [];
      const availableColumns = table.columns.filter(
        (col) => !usedFields.includes(col.name.toLowerCase())
      );
      const availableSelectFields = selectFields.filter(
        ({ index }) => !usedFields.includes(`${index}`)
      );
      return {
        from: word?.from ?? cursorPos,
        options: [
          {
            label: ",",
            type: "operator",
            apply: ", ",
            detail: "Add another column",
          },
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
    if (
      new RegExp(`from\\s+(\\w+)(?:\\s+(\\w+))?\\s+where\\s*$`, "i").test(
        docText
      )
    ) {
      const tableNameMatch = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+where\s*$/i
      );
      if (tableNameMatch) {
        const tableName = tableNameMatch[1].toLowerCase();
        const alias = tableNameMatch[2]?.toLowerCase() || tableName;
        if (tables[tableName]) {
          return {
            from: word?.from ?? cursorPos,
            options: getColumnOptions([], tables[tableName], alias),
          };
        }
      }
    }

    // 13. After a complete WHERE condition, suggest AND, OR, GROUP BY, ORDER BY, or LIMIT
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+\\w+)?\\s+where\\s+.*?(?:\\w+\\s*(=|\\!=|>|<|>=|<=|LIKE)\\s*('[^']*'|[^' ]\\w*)|\\w+\\s*BETWEEN\\s*('[^']*'|[^' ]\\w*)\\s*AND\\s*('[^']*'|[^' ]\\w*)|\\w+\\s*(IS NULL|IS NOT NULL))\\s*$`,
        "i"
      ).test(docText)
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
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+where\\s+.*?\\b(\\w+)\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+where\s+.*?\\b(\w+)\s*$/i
      );
      if (match) {
        const tableName = match[1].toLowerCase();
        const columnName = match[3].toLowerCase();
        if (
          tables[tableName]?.columns.some(
            (col) => col.name.toLowerCase() === columnName
          )
        ) {
          return {
            from: word?.from ?? cursorPos,
            options: [
              {
                label: "=",
                type: "operator",
                apply: "= ",
                detail: "Equal to",
              },
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
              {
                label: "<",
                type: "operator",
                apply: "< ",
                detail: "Less than",
              },
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
      }
    }

    // 15. After WHERE column operator, suggest values
    const valuePattern = new RegExp(
      `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+where\\s+(?:.*?\\s+(?:and|or)\\s+)?(\\w+)\\s*(=|\\!=|>|<|>=|<=|LIKE|BETWEEN)\\s*(?:('[^']*'|[^' ]\\w*)?)?$`,
      "i"
    );
    if (valuePattern.test(docText)) {
      const match = docText.match(valuePattern);
      if (match) {
        const tableName = match[1].toLowerCase();
        const column = match[3];
        const operator = match[4];
        const value1 = match[5];
        if (tables[tableName]) {
          const columnDef = tables[tableName].columns.find(
            (col) => col.name.toLowerCase() === column?.toLowerCase()
          );
          if (
            columnDef &&
            (column as keyof PowerRanger) in tables[tableName].data[0]
          ) {
            const columnType = columnDef.type;

            if (operator.toUpperCase() === "BETWEEN") {
              const sampleValues = getUniqueValues(
                column as keyof PowerRanger,
                columnType,
                tables[tableName]
              );
              return {
                from: word?.from ?? cursorPos,
                options: sampleValues.map((value) => ({
                  label: value,
                  type: "value",
                  apply: value + (value1 ? "" : " AND "),
                  detail: value1
                    ? "Second value for BETWEEN"
                    : "First value for BETWEEN",
                })),
              };
            }

            if (operator.toUpperCase() === "LIKE") {
              const likePatterns = getLikePatternSuggestions(
                tables[tableName],
                column as keyof PowerRanger
              );
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

            const sampleValues = getUniqueValues(
              column as keyof PowerRanger,
              columnType,
              tables[tableName]
            );
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
      }
    }

    // 16. After AND or OR, suggest remaining columns
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+where\\s+.*?\\s+(and|or)\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+where\s+(.+?)\s+(?:and|or)\s*$/i
      );
      if (match) {
        const tableName = match[1].toLowerCase();
        const alias = match[2]?.toLowerCase() || tableName;
        const whereClause = match[3] || "";
        if (tables[tableName]) {
          const usedColumns = getUsedColumnsInWhere(
            whereClause,
            tables[tableName]
          );
          return {
            from: word?.from ?? cursorPos,
            options: getColumnOptions(usedColumns, tables[tableName], alias),
          };
        }
      }
    }

    // 17. Suggest number after LIMIT
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+\\w+)?\\s+(?:where\\s+.*?\\s+)?(?:group\\s+by\\s+.*?\\s+)?(?:order\\s+by\\s+.*?\\s+)?limit\\s*$`,
        "i"
      ).test(docText)
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
        options: getColumnOptions([], table),
      };
    }

    // 20. After ORDER BY column, suggest ASC, DESC, or LIMIT
    if (/order\s+by\s+\w+\s*$/i.test(docText)) {
      const orderByColumn = docText.match(/order\s+by\s+(\w+)\s*$/i)?.[1];
      if (
        orderByColumn &&
        table.columns.some(
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
    if (/group\s+by\s+(?:\w+|\d+)(?:\s*,\s*(?:\w+|\d+))*\s*$/i.test(docText)) {
      const groupByMatch = docText.match(/group\s+by\s+(.+)/i);
      const usedFields = groupByMatch
        ? groupByMatch[1]
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f)
        : [];
      const availableColumns = table.columns.filter(
        (col) => !usedFields.includes(col.name.toLowerCase())
      );
      const availableSelectFields = selectFields.filter(
        ({ index }) => !usedFields.includes(`${index}`)
      );
      return {
        from: word?.from ?? cursorPos,
        options: [
          {
            label: ",",
            type: "operator",
            apply: ", ",
            detail: "Add another column",
          },
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
        options: getAggregateOptions(table),
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

    // 25. After CASE, suggest WHEN
    if (/^select\s+.*?\bcase\s*$/i.test(docText)) {
      return {
        from: word?.from ?? cursorPos,
        options: [
          {
            label: "WHEN",
            type: "keyword",
            apply: "WHEN ",
            detail: "Start a condition",
          },
        ],
      };
    }

    // 26. After CASE WHEN, suggest columns
    if (/^select\s+.*?\bcase\s+when\s*$/i.test(docText)) {
      return {
        from: word?.from ?? cursorPos,
        options: getColumnOptions([], table),
      };
    }

    // 27. After CASE WHEN column, suggest operators
    if (
      /^select\s+.*?\bcase\s+when\s+\w+\s*$/i.test(docText) &&
      table.columns.some((col) =>
        new RegExp(`when\\s+${col.name.toLowerCase()}\\s*$`, "i").test(docText)
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

    // 28. After CASE WHEN column operator, suggest values
    const caseValuePattern =
      /^select\s+.*?\bcase\s+when\s+(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|BETWEEN)\s*(?:('[^']*'|[^' ]\w*)?)?$/i;
    if (caseValuePattern.test(docText)) {
      const match = docText.match(caseValuePattern);
      if (match) {
        const column = match[1];
        const operator = match[2];
        const value1 = match[3];
        const columnDef = table.columns.find(
          (col) => col.name.toLowerCase() === column?.toLowerCase()
        );
        if (columnDef && (column as keyof PowerRanger) in table.data[0]) {
          const columnType = columnDef.type;

          if (operator.toUpperCase() === "BETWEEN") {
            const sampleValues = getUniqueValues(
              column as keyof PowerRanger,
              columnType,
              table
            );
            return {
              from: word?.from ?? cursorPos,
              options: sampleValues.map((value) => ({
                label: value,
                type: "value",
                apply: value + (value1 ? "" : " AND "),
                detail: value1
                  ? "Second value for BETWEEN"
                  : "First value for BETWEEN",
              })),
            };
          }

          if (operator.toUpperCase() === "LIKE") {
            const likePatterns = getLikePatternSuggestions(
              table,
              column as keyof PowerRanger
            );
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
            return {
              from: word?.from ?? cursorPos,
              options: [
                {
                  label: "THEN",
                  type: "keyword",
                  apply: " THEN ",
                  detail: "Specify output for condition",
                },
              ],
            };
          }

          const sampleValues = getUniqueValues(
            column as keyof PowerRanger,
            columnType,
            table
          );
          return {
            from: word?.from ?? cursorPos,
            options: sampleValues.map((value) => ({
              label: value,
              type: "value",
              apply: value + " ",
              detail: "Value",
            })),
          };
        }
      }
    }

    // 29. After CASE WHEN column operator value, suggest THEN
    if (
      /^select\s+.*?\bcase\s+when\s+\w+\s*(=|\!=|>|<|>=|<=|LIKE)\s*('[^']*'|[^' ]\w*)\s*$/i.test(
        docText
      ) ||
      /^select\s+.*?\bcase\s+when\s+\w+\s*between\s*('[^']*'|[^' ]\w*)\s*and\s*('[^']*'|[^' ]\w*)\s*$/i.test(
        docText
      )
    ) {
      return {
        from: word?.from ?? cursorPos,
        options: [
          {
            label: "THEN",
            type: "keyword",
            apply: " THEN ",
            detail: "Specify output for condition",
          },
        ],
      };
    }

    // 30. After THEN, suggest values or columns
    if (/^select\s+.*?\bcase\s+when\s+.*?\s+then\s*$/i.test(docText)) {
      return {
        from: word?.from ?? cursorPos,
        options: [
          ...getColumnOptions([], table),
          ...["'value'", "'true'", "'false'", "'output'"].map((val) => ({
            label: val,
            type: "value",
            apply: val + " ",
            detail: "Output value",
          })),
        ],
      };
    }

    // 31. After THEN value or ELSE value, suggest WHEN, ELSE, or END
    if (
      /^select\s+.*?\bcase\s+when\s+.*?\s+then\s*('[^']*'|[^' ]\w*)\s*$/i.test(
        docText
      ) ||
      /^select\s+.*?\bcase\s+when\s+.*?\s+else\s*('[^']*'|[^' ]\w*)\s*$/i.test(
        docText
      )
    ) {
      return {
        from: word?.from ?? cursorPos,
        options: [
          {
            label: "WHEN",
            type: "keyword",
            apply: " WHEN ",
            detail: "Add another condition",
          },
          {
            label: "ELSE",
            type: "keyword",
            apply: " ELSE ",
            detail: "Specify default output",
          },
          {
            label: "END",
            type: "keyword",
            apply: " END ",
            detail: "Close CASE statement",
          },
        ],
      };
    }

    // 32. After ELSE, suggest values or columns
    if (/^select\s+.*?\bcase\s+when\s+.*?\s+else\s*$/i.test(docText)) {
      return {
        from: word?.from ?? cursorPos,
        options: [
          ...getColumnOptions([], table),
          ...["'value'", "'true'", "'false'", "'output'"].map((val) => ({
            label: val,
            type: "value",
            apply: val + " ",
            detail: "Default output value",
          })),
        ],
      };
    }

    // 33. After END, suggest AS, comma, or FROM
    if (/^select\s+.*?\bcase\s+when\s+.*?\s+end\s*$/i.test(docText)) {
      return {
        from: word?.from ?? cursorPos,
        options: [
          {
            label: "AS",
            type: "keyword",
            apply: " AS 'Output' ",
            detail: "Alias the CASE statement",
          },
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
        ],
      };
    }

    // 34. After END AS 'alias', suggest comma or FROM
    if (
      /^select\s+.*?\bcase\s+when\s+.*?\s+end\s+as\s+'.*?'\s*$/i.test(docText)
    ) {
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
        ],
      };
    }

    // 36. After INNER JOIN, suggest other table names, filtering by partial input
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+\\w+)?\\s+inner\\s+join\\s*(\\w*)$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+\w+)?\s+inner\s+join\s*(\w*)$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const partialTable = match[2].toLowerCase();
        if (tables[firstTable]) {
          const usedTables = docText
            .match(/from\s+(\w+)|inner\s+join\s+(\w+)/gi)
            ?.map((t) => {
              const matchResult = t.match(/\w+$/);
              return matchResult ? matchResult[0].toLowerCase() : "";
            })
            .filter((t) => t) || [firstTable];
          const filteredTables = Object.keys(tables)
            .filter(
              (tableName) => !usedTables.includes(tableName.toLowerCase())
            )
            .filter((tableName) =>
              tableName.toLowerCase().startsWith(partialTable)
            );
          return {
            from: word?.from ?? cursorPos,
            options: filteredTables.map((tableName) => ({
              label: tableName,
              type: "table",
              apply: tableName + " ",
              detail: "Table name",
            })),
          };
        }
      }
    }

    // 37. After INNER JOIN table_name, suggest ON
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+inner\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s*$`,
        "i"
      ).test(docText) &&
      !/on\s*$/i.test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+inner\s+join\s+(\w+)(?:\s+(\w+))?\s*$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const secondTable = match[3].toLowerCase();
        if (tables[firstTable] && tables[secondTable]) {
          return {
            from: word?.from ?? cursorPos,
            options: [
              {
                label: "ON",
                type: "keyword",
                apply: "ON ",
                detail: "Specify join condition",
              },
            ],
          };
        }
      }
    }

    // 38. After ON, suggest columns from both tables
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+inner\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s+on\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+inner\s+join\s+(\w+)(?:\s+(\w+))?\s+on\s*$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const firstAlias = match[2]?.toLowerCase() || firstTable;
        const secondTable = match[3].toLowerCase();
        const secondAlias = match[4]?.toLowerCase() || secondTable;
        if (tables[firstTable] && tables[secondTable]) {
          const firstTableColumns = getColumnOptions(
            [],
            tables[firstTable],
            firstAlias
          );
          const secondTableColumns = getColumnOptions(
            [],
            tables[secondTable],
            secondAlias
          );
          return {
            from: word?.from ?? cursorPos,
            options: [...firstTableColumns, ...secondTableColumns],
          };
        }
      }
    }

    // 39. After ON table1.column, suggest operators
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+inner\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s+on\\s+(\\w+)\\.(\\w+)\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+inner\s+join\s+(\w+)(?:\s+(\w+))?\s+on\s+(\w+)\.(\w+)\s*$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const firstAlias = match[2]?.toLowerCase() || firstTable;
        const secondTable = match[3].toLowerCase();
        const columnName = match[6].toLowerCase();
        const tableOrAlias = match[5].toLowerCase();
        const targetTable =
          tableOrAlias === firstTable || tableOrAlias === firstAlias
            ? firstTable
            : secondTable;
        if (
          tables[firstTable] &&
          tables[secondTable] &&
          tables[targetTable].columns.some(
            (col) => col.name.toLowerCase() === columnName
          )
        ) {
          return {
            from: word?.from ?? cursorPos,
            options: [
              {
                label: "=",
                type: "operator",
                apply: "= ",
                detail: "Equal to (for JOIN condition)",
              },
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
              {
                label: "<",
                type: "operator",
                apply: "< ",
                detail: "Less than",
              },
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
      }
    }

    // 40. After ON table1.column =, suggest columns from the other table
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+inner\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s+on\\s+(\\w+)\\.(\\w+)\\s*=\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+inner\s+join\s+(\w+)(?:\s+(\w+))?\s+on\s+(\w+)\.(\w+)\s*=\s*$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const firstAlias = match[2]?.toLowerCase() || firstTable;
        const secondTable = match[3].toLowerCase();
        const secondAlias = match[4]?.toLowerCase() || secondTable;
        const tableOrAlias = match[5].toLowerCase();
        const firstTableUsed =
          tableOrAlias === firstTable || tableOrAlias === firstAlias;
        if (tables[firstTable] && tables[secondTable]) {
          const targetTable = firstTableUsed ? secondTable : firstTable;
          const targetAlias = firstTableUsed ? secondAlias : firstAlias;
          return {
            from: word?.from ?? cursorPos,
            options: getColumnOptions([], tables[targetTable], targetAlias),
          };
        }
      }
    }

    // 41. After ON table1.column = table2.column, suggest INNER JOIN, WHERE, GROUP BY, ORDER BY, or LIMIT
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+inner\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s+on\\s+(\\w+)\\.(\\w+)\\s*=\\s*(\\w+)\\.(\\w+)\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+inner\s+join\s+(\w+)(?:\s+(\w+))?\s+on\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)\s*$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const secondTable = match[3].toLowerCase();
        if (tables[firstTable] && tables[secondTable]) {
          return {
            from: word?.from ?? cursorPos,
            options: [
              {
                label: "INNER JOIN",
                type: "keyword",
                apply: "INNER JOIN ",
                detail: "Join with another table, returning matching rows",
              },
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
      }
    }

    return null;
  };

  useEffect(() => {
    const state = EditorState.create({
      doc: "",
      extensions: [
        sql(),
        oneDark,
        keymap.of([
          indentWithTab,
          {
            key: "Mod-Enter",
            run: (view: EditorView) => {
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
  }, [runQuery, uniqueSeasons, editorRef]);

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
