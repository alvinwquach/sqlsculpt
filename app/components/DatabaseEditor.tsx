"use client";

import { useState, useEffect, useRef } from "react";
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

type QueryResult = Partial<PowerRanger> | DescribeResult | ShowTablesResult;

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
      power_level: 90,
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
      power_level: 85,
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
      power_level: 80,
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
        className={`px-3 py-2 rounded-r-md bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
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
    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-2 bg-gray-700 text-white text-xs rounded px-3 py-1.5 shadow-lg animate-in fade-in slide-in-from-top-2">
      {message}
    </div>
  );
}

export default function SqlEditor() {
  const editorRef = useRef<EditorView | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"json" | "table">("json");
  const [tooltip, setTooltip] = useState<string | null>(null);

  const uniqueSeasons = Array.from(
    new Set(powerRangersData.data.map((row) => row.season))
  ).sort();

  const formatColumnName = (columnName: string): string => {
    return columnName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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

    // Handle quoted string values
    const cleanValue = value.replace(/^'|'$/g, "");

    // Convert values based on column type
    let typedColumnValue: string | number;
    let typedValue: string | number;

    if (columnType === "integer") {
      typedColumnValue = Number(columnValue);
      typedValue = Number(cleanValue);
    } else if (columnType === "date") {
      typedColumnValue = columnValue as string;
      typedValue = cleanValue;
    } else {
      typedColumnValue = columnValue as string;
      typedValue = cleanValue;
    }

    switch (operator) {
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

  const runQuery = (view: EditorView): boolean => {
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

    // Match SELECT or SELECT DISTINCT queries with optional WHERE clause
    const selectDistinctMatch = query.match(
      /^select\s+distinct\s+(.+?)\s+from\s+power_rangers(?:\s+where\s+(.+?))?\s*;?$/i
    );
    const selectMatch = query.match(
      /^select\s+(?!distinct)(.+?)\s+from\s+power_rangers(?:\s+where\s+(.+?))?\s*;?$/i
    );

    if (!selectMatch && !selectDistinctMatch) {
      setResult(
        "Error: Query must be 'SELECT [DISTINCT] <fields> FROM power_rangers [WHERE <condition>]', 'DESCRIBE power_rangers', or 'SHOW TABLES'"
      );
      setTooltip(null);
      return true;
    }

    const isDistinct = !!selectDistinctMatch;
    const match = selectDistinctMatch ?? selectMatch;
    const rawFieldsWithAliases = match![1].split(",").map((f) => f.trim());
    const whereClause = match![2]?.trim();
    const fields: string[] = [];
    const aliases: { [key: string]: string } = {};

    for (const field of rawFieldsWithAliases) {
      const asMatch = field.match(/^(.+?)\s+as\s+'([^']+)'\s*$/i);
      if (asMatch) {
        const fieldName = asMatch[1].trim();
        const aliasName = asMatch[2];
        fields.push(fieldName);
        aliases[fieldName] = aliasName;
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

    // Start with full PowerRanger rows
    let filteredData: PowerRanger[] = powerRangersData.data;

    // Apply WHERE clause if present
    if (whereClause) {
      const whereMatch = whereClause.match(
        /^(\w+)\s*(=|\!=|>|<|>=|<=)\s*('[^']*'|[0-9]+)$/i
      );
      if (!whereMatch) {
        setResult(
          "Error: Invalid WHERE clause. Must be 'column operator value' (e.g., id = 1 or season = 'Mighty Morphin')"
        );
        setTooltip(null);
        return false;
      }

      const column = whereMatch[1];
      const operator = whereMatch[2];
      const value = whereMatch[3];

      if (!powerRangersData.columns.some((col) => col.name === column)) {
        setResult(`Error: Invalid column in WHERE clause: ${column}`);
        setTooltip(null);
        return false;
      }

      filteredData = filteredData.filter((row) =>
        evaluateCondition(row, column, operator, value)
      );
    }

    // Map to selected fields
    let resultData: Partial<PowerRanger>[] = filteredData.map((row) =>
      Object.fromEntries(
        actualFields.map((field) => {
          const alias = aliases[field] || field;
          return [alias, row[field as keyof PowerRanger]];
        })
      )
    );

    // Apply DISTINCT if specified
    if (isDistinct) {
      const distinctRows = new Set<string>();
      resultData = resultData.filter((row) => {
        const key = actualFields
          .map((field) => {
            const alias = aliases[field] || field;
            return `${alias}:${row[alias as keyof PowerRanger]}`;
          })
          .join("|");
        if (distinctRows.has(key)) {
          return false;
        }
        distinctRows.add(key);
        return true;
      });

      // Show tooltip for DISTINCT with multiple columns
      if (fields.length > 1) {
        const groupByFields = fields.map((field) => aliases[field] || field);
        setTooltip(
          `SELECT DISTINCT ${groupByFields.join(
            ", "
          )} FROM power_rangers is roughly equivalent to: SELECT ${groupByFields.join(
            ", "
          )} FROM power_rangers GROUP BY ${groupByFields.join(", ")}`
        );
        // Auto-dismiss tooltip after 5 seconds
        setTimeout(() => setTooltip(null), 5000);
      } else {
        setTooltip(null);
      }
    } else {
      setTooltip(null);
    }

    setResult(JSON.stringify(resultData, null, 2));
    return true;
  };

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
        );
      }

      if (columnType === "date" || columnType === "text") {
        if (column.toLowerCase() === "season") {
          return uniqueSeasons.map((season) => `'${season}'`);
        }
        return Array.from(
          new Set(
            powerRangersData.data.map(
              (row) => `'${row[column as keyof PowerRanger]}'`
            )
          )
        );
      }

      return [];
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

    const completion = (ctx: CompletionContext) => {
      const word = ctx.matchBefore(/[\w*']*/);
      const docText = ctx.state.doc.toString().toLowerCase();
      const fullDocText = ctx.state.doc.toString();
      const cursorPos = ctx.pos;

      const selectMatch = fullDocText
        .substring(0, cursorPos)
        .match(/^select\s+(?:distinct\s+)?(.+?)(?:\s+from|$)/i);
      const alreadySelectedFields = selectMatch
        ? selectMatch[1].split(",").map((f) =>
            f
              .trim()
              .replace(/\s+as\s+'.*?'$/i, "")
              .toLowerCase()
          )
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

      // 2. After DESCRIBE suggest the table
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

      // 3. Suggest all columns, *, or DISTINCT after SELECT
      if (/^select\s*$/i.test(docText)) {
        const options = getColumnOptions(alreadySelectedFields);
        options.unshift(
          { label: "*", type: "field", detail: "all columns", apply: "*" },
          {
            label: "DISTINCT",
            type: "keyword",
            apply: "DISTINCT ",
            detail: "Select unique values",
          }
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

      // 5. After comma in SELECT, suggest remaining columns
      if (
        /^select\s+(?:distinct\s+)?[\w\s,'*]+$/i.test(docText) &&
        /,\s*$/.test(docText.substring(0, cursorPos)) &&
        !docText.includes("from")
      ) {
        return {
          from: word?.from ?? cursorPos,
          options: getColumnOptions(alreadySelectedFields),
        };
      }

      // 6. If a field is selected and alias is not yet provided, suggest AS or FROM
      if (
        /^select\s+(?:distinct\s+)?[\s\w,'*]+$/i.test(docText) &&
        !docText.includes("from") &&
        !/,\s*$/.test(docText.substring(0, cursorPos))
      ) {
        const fieldsBeforeCursor = fullDocText.match(
          /^select\s+(?:distinct\s+)?(.+?)$/i
        )?.[1];
        if (fieldsBeforeCursor) {
          const lastField = fieldsBeforeCursor.split(",").slice(-1)[0].trim();
          const lastFieldName = lastField
            .replace(/\s+as\s+'.*?'$/i, "")
            .trim()
            .toLowerCase();
          const hasAlias = /\s+as\s+'.*?'$/i.test(lastField);

          if (
            !hasAlias &&
            (lastFieldName === "*" ||
              powerRangersData.columns.some(
                (col) => col.name.toLowerCase() === lastFieldName
              ))
          ) {
            const formattedAlias =
              lastFieldName !== "*"
                ? formatColumnName(lastFieldName)
                : undefined;
            const options = [
              {
                label: "FROM",
                type: "keyword",
                apply: " FROM ",
                detail: "Specify table",
              },
            ];
            if (formattedAlias) {
              options.unshift({
                label: "AS",
                type: "keyword",
                apply: ` AS '${formattedAlias}'`,
                detail: "Alias the column",
              });
            }
            return { from: word?.from ?? cursorPos, options };
          }
        }
      }

      // 7. After AS 'alias', suggest next field or FROM
      if (/as\s*'.*?'\s*$/i.test(docText) && !docText.includes("from")) {
        const endsWithComma = /,\s*$/.test(docText.substring(0, cursorPos));
        const options = endsWithComma
          ? [
              ...getColumnOptions(alreadySelectedFields),
              {
                label: "FROM",
                type: "keyword",
                apply: " FROM ",
                detail: "Proceed to table selection",
              },
            ]
          : [
              {
                label: "FROM",
                type: "keyword",
                apply: " FROM ",
                detail: "Specify table",
              },
            ];
        return { from: word?.from ?? cursorPos, options };
      }

      // 8. After FROM, suggest table name
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

      // 9. After FROM power_rangers, suggest WHERE
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
          ],
        };
      }

      // 10. After WHERE, suggest columns
      if (/from\s+power_rangers\s+where\s*$/i.test(docText)) {
        return { from: word?.from ?? cursorPos, options: getColumnOptions([]) };
      }

      // 11. After WHERE column, suggest operators
      if (
        /from\s+power_rangers\s+where\s+\w+\s*$/i.test(docText) &&
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
          ],
        };
      }

      // 12. After WHERE column operator or between quotes, suggest all available values
      const valuePattern =
        /from\s+power_rangers\s+where\s+(\w+)\s*(=|\!=|>|<|>=|<=)\s*('[^']*')?\s*$/i;
      const operatorPattern =
        /from\s+power_rangers\s+where\s+(\w+)\s*(=|\!=|>|<|>=|<=)\s*$/i;
      if (valuePattern.test(docText) || operatorPattern.test(docText)) {
        const match =
          docText.match(valuePattern) || docText.match(operatorPattern);
        if (match) {
          const column = match[1];
          const columnType = powerRangersData.columns.find(
            (col) => col.name.toLowerCase() === column.toLowerCase()
          )?.type;
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

      return null; // Default case: no suggestion
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
  }, []);

  const isJson = (str: string) => {
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
        <div className="text-red-400">Error: Invalid JSON format</div>
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
      return (
        <pre className="text-green-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {result}
        </pre>
      );
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
          <div className="relative group inline-block">
            <button
              onClick={() => editorRef.current && runQuery(editorRef.current)}
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded px-3 py-1.5 whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-bottom-2"
            >
              {navigator.platform.includes("Mac") ? "⌘+Enter" : "Ctrl+Enter"}
            </button>
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