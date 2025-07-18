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
        season_id: 2,
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
  power_rangers_turbo: {
    tableName: "power_rangers_turbo",
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
        user: "Tommy Oliver",
        ranger_color: "Red",
        ranger_designation: "Red Turbo Ranger",
        weapon: ["Turbo Blaster", "Turbo Sword", "Lightning Sword"],
        season_id: 3,
        joined_date: "1997-04-19",
        status: "Inactive",
        power_level: 96,
        location: "Angel Grove",
        gear: ["Turbo Morpher", "Red Turbo Cart"],
        zord: ["Red Lightning"],
      },
      {
        id: 2,
        user: "Adam Park",
        ranger_color: "Green",
        ranger_designation: "Green Turbo Ranger",
        weapon: ["Turbo Blaster", "Turbo Sword", "Thunder Cannon"],
        season_id: 3,
        joined_date: "1997-04-19",
        status: "Inactive",
        power_level: 93,
        location: "Angel Grove",
        gear: ["Turbo Morpher", "Green Turbo Cart"],
        zord: ["Desert Thunder"],
      },
      {
        id: 3,
        user: "Justin Stewart",
        ranger_color: "Blue",
        ranger_designation: "Blue Turbo Ranger",
        weapon: ["Turbo Blaster", "Turbo Sword", "Hand Blasters"],
        season_id: 3,
        joined_date: "1997-04-19",
        status: "Inactive",
        power_level: 89.5,
        location: "Angel Grove",
        gear: ["Turbo Morpher", "Blue Turbo Cart"],
        zord: ["Mountain Blaster", "Siren Blaster"],
      },
      {
        id: 4,
        user: "Katherine Hillard",
        ranger_color: "Pink",
        ranger_designation: "Pink Turbo Ranger",
        weapon: ["Turbo Blaster", "Turbo Sword", "Wind Fire"],
        season_id: 3,
        joined_date: "1997-04-19",
        status: "Inactive",
        power_level: 90,
        location: "Angel Grove",
        gear: ["Turbo Morpher", "Pink Turbo Cart"],
        zord: ["Wind Chaser"],
      },
      {
        id: 5,
        user: "Tanya Sloan",
        ranger_color: "Yellow",
        ranger_designation: "Yellow Turbo Ranger",
        weapon: ["Turbo Blaster", "Turbo Sword", "Star Charges"],
        season_id: 3,
        joined_date: "1997-04-19",
        status: "Inactive",
        power_level: 88,
        location: "Angel Grove",
        gear: ["Turbo Morpher", "Turbo Navigator", "Yellow Turbo Cart"],
        zord: ["Dune Star"],
      },
      {
        id: 6,
        user: "Cassie Chan",
        ranger_color: "Pink",
        ranger_designation: "Pink Turbo Ranger",
        weapon: ["Turbo Blaster", "Turbo Sword", "Wind Fire"],
        season_id: 3,
        joined_date: "1997-09-10",
        status: "Active",
        power_level: 91.7,
        location: "Angel Grove",
        gear: ["Turbo Morpher", "Pink Turbo Cart"],
        zord: ["Wind Chaser", "Wind Rescue"],
      },
      {
        id: 7,
        user: "Ashley Hammond",
        ranger_color: "Yellow",
        ranger_designation: "Yellow Turbo Ranger",
        weapon: ["Turbo Blaster", "Turbo Sword", "Star Charges"],
        season_id: 3,
        joined_date: "1997-09-10",
        status: "Active",
        power_level: 91.2,
        location: "Angel Grove",
        gear: ["Turbo Morpher", "Turbo Navigator", "Yellow Turbo Cart"],
        zord: ["Dune Star", "Star Racer"],
      },
      {
        id: 8,
        user: "Carlos Vallerte",
        ranger_color: "Green",
        ranger_designation: "Green Turbo Ranger",
        weapon: ["Turbo Blaster", "Turbo Sword", "Thunder Cannon"],
        season_id: 3,
        joined_date: "1997-09-10",
        status: "Active",
        power_level: 90.5,
        location: "Angel Grove",
        gear: ["Turbo Morpher", "Green Turbo Cart"],
        zord: ["Desert Thunder", "Thunder Loader"],
      },
      {
        id: 9,
        user: "Theodore J. Jarvis Johnson",
        ranger_color: "Red",
        ranger_designation: "Red Turbo Ranger",
        weapon: ["Turbo Blaster", "Turbo Sword", "Lightning Sword"],
        season_id: 3,
        joined_date: "1997-09-10",
        status: "Active",
        power_level: 94.3,
        location: "Angel Grove",
        gear: ["Turbo Morpher", "Red Turbo Cart"],
        zord: ["Red Lightning", "Lightning Fire Tamer"],
      },
      {
        id: 10,
        user: "Phantom Ranger",
        ranger_color: "Black",
        ranger_designation: "Phantom Ranger",
        weapon: ["Phantom Laser"],
        season_id: 3,
        joined_date: "1997-10-10",
        status: "Active",
        power_level: 98.6,
        location: "Eltar / Angel Grove",
        gear: ["Power Ruby", "Turbo Navigator"],
        zord: ["Artillatron", "Delta Megaship (formerly)"],
      },
    ],
  },
  power_rangers_in_space: {
    tableName: "power_rangers_in_space",
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
        id: 14,
        user: "Andros",
        ranger_color: "Red",
        ranger_designation: "Red Space Ranger",
        weapon: ["Spiral Saber", "Astro Blaster"],
        season_id: 4,
        joined_date: "1998-02-06",
        status: "Active",
        power_level: 98.7,
        location: "Space",
        gear: [
          "Astro Morpher",
          "Battlizer",
          "Red Battlizer Armor",
          "Red Galaxy Glider",
        ],
        zord: ["Astro Megazord", "Delta Megazord", "Mega V1"],
      },
      {
        id: 15,
        user: "Theodore J. Jarvis Johnson",
        ranger_color: "Blue",
        ranger_designation: "Blue Space Ranger",
        weapon: ["Astro Axe", "Astro Blaster"],
        season_id: 4,
        joined_date: "1998-02-06",
        status: "Active",
        power_level: 97.5,
        location: "Space",
        gear: ["Astro Morpher", "Blue Galaxy Glider"],
        zord: ["Mega V3"],
      },
      {
        id: 16,
        user: "Carlos Vallerte",
        ranger_color: "Black",
        ranger_designation: "Black Space Ranger",
        weapon: ["Lunar Lance", "Astro Blaster"],
        season_id: 4,
        joined_date: "1998-02-06",
        status: "Active",
        power_level: 96.3,
        location: "Space",
        gear: ["Astro Morpher", "Black Galaxy Glider"],
        zord: ["Mega V2"],
      },
      {
        id: 17,
        user: "Ashley Hammond",
        ranger_color: "Yellow",
        ranger_designation: "Yellow Space Ranger",
        weapon: ["Star Slinger", "Astro Blaster"],
        season_id: 4,
        joined_date: "1998-02-06",
        status: "Active",
        power_level: 94.8,
        location: "Space",
        gear: ["Astro Morpher", "Yellow Galaxy Glider"],
        zord: ["Mega V4"],
      },
      {
        id: 18,
        user: "Cassie Chan",
        ranger_color: "Pink",
        ranger_designation: "Pink Space Ranger",
        weapon: ["Satellite Stunner", "Astro Blaster"],
        season_id: 4,
        joined_date: "1998-02-06",
        status: "Active",
        power_level: 95.2,
        location: "Space",
        gear: ["Astro Morpher", "Pink Galaxy Glider"],
        zord: ["Mega V5"],
      },
      {
        id: 19,
        user: "Zhane",
        ranger_color: "Silver",
        ranger_designation: "Silver Space Ranger",
        weapon: ["Super Silverizer"],
        season_id: 4,
        joined_date: "1998-02-06",
        status: "Active",
        power_level: 99.0,
        location: "Space",
        gear: ["Digimorpher", "Galactic Rover", "Silver Cycle"],
        zord: ["Mega Winger"],
      },
    ],
  },
  power_rangers_lost_galaxy: {
    tableName: "power_rangers_lost_galaxy",
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
        user: "Leo Corbett",
        ranger_color: "Red",
        ranger_designation: "Red Galaxy Ranger",
        weapon: ["Quasar Saber", "Transdagger", "Quasar Launcher"],
        season_id: 5,
        joined_date: "1999-02-06",
        status: "Active",
        power_level: 97,
        location: "Terra Venture",
        gear: [
          "Transmorpher",
          "Red Armor",
          "Red Astro Cycle",
          "Red Jet Jammer",
          "Capsular Cycle",
          "Lights of Orion Armor",
        ],
        zord: ["Lion Galactazord"],
      },
      {
        id: 2,
        user: "Kai Chen",
        ranger_color: "Blue",
        ranger_designation: "Blue Galaxy Ranger",
        weapon: ["Quasar Saber", "Transdagger", "Quasar Launcher"],
        season_id: 5,
        joined_date: "1999-02-06",
        status: "Active",
        power_level: 93,
        location: "Terra Venture",
        gear: [
          "Transmorpher",
          "Blue Jet Jammer",
          "Blue Astro Cycle",
          "Lights of Orion Armor",
        ],
        zord: ["Gorilla Galactazord"],
      },
      {
        id: 3,
        user: "Damon Henderson",
        ranger_color: "Green",
        ranger_designation: "Green Galaxy Ranger",
        weapon: ["Quasar Saber", "Transdagger", "Quasar Launcher"],
        season_id: 5,
        joined_date: "1999-02-06",
        status: "Active",
        power_level: 92,
        location: "Terra Venture",
        gear: [
          "Transmorpher",
          "Green Jet Jammer",
          "Green Astro Cycle",
          "Lights of Orion Armor",
        ],
        zord: ["Condor Galactazord"],
      },
      {
        id: 4,
        user: "Kendrix Morgan",
        ranger_color: "Pink",
        ranger_designation: "Pink Galaxy Ranger",
        weapon: ["Quasar Saber", "Transdagger", "Quasar Launcher"],
        season_id: 5,
        joined_date: "1999-02-06",
        status: "Inactive",
        power_level: 90.5,
        location: "Terra Venture",
        gear: ["Transmorpher", "Pink Jet Jammer", "Lights of Orion Armor"],
        zord: ["Wildcat Galactazord"],
      },
      {
        id: 5,
        user: "Karone",
        ranger_color: "Pink",
        ranger_designation: "Pink Galaxy Ranger",
        weapon: ["Quasar Saber", "Transdagger", "Quasar Launcher"],
        season_id: 5,
        joined_date: "1999-10-10",
        status: "Active",
        power_level: 91.8,
        location: "Terra Venture",
        gear: ["Transmorpher", "Pink Jet Jammer", "Lights of Orion Armor"],
        zord: ["Wildcat Galactazord"],
      },
      {
        id: 6,
        user: "Maya",
        ranger_color: "Yellow",
        ranger_designation: "Yellow Galaxy Ranger",
        weapon: ["Quasar Saber", "Transdagger", "Quasar Launcher"],
        season_id: 5,
        joined_date: "1999-02-06",
        status: "Active",
        power_level: 92.3,
        location: "Terra Venture",
        gear: ["Transmorpher", "Yellow Jet Jammer", "Lights of Orion Armor"],
        zord: ["Wolf Galactazord"],
      },
      {
        id: 7,
        user: "Mike Corbett",
        ranger_color: "Magna Defender",
        ranger_designation: "n/a",
        weapon: ["Magna Blaster"],
        season_id: 5,
        joined_date: "1999-03-10",
        status: "Active",
        power_level: 99,
        location: "Terra Venture",
        gear: ["Magna Defender Morpher"],
        zord: ["Torozord"],
      },
    ],
  },
  power_rangers_lightspeed_rescue: {
    tableName: "power_rangers_lightspeed_rescue",
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
        id: 20,
        user: "Carter Grayson",
        ranger_color: "Red",
        ranger_designation: "Red Lightspeed Rescue Ranger",
        weapon: [
          "Rescue Blaster",
          "Rescue Drill",
          "V-Lancer",
          "Thermo Blaster",
        ],
        season_id: 6,
        joined_date: "2000-02-12",
        status: "Active",
        power_level: 95.5,
        location: "Mariner Bay",
        gear: [
          "Rescue Morpher",
          "Battle Booster",
          "Trans Armor Cycle",
          "Mobile Armor Vehicle",
        ],
        zord: ["Pyro Rescue One", "Rail Rescue One", "Omega Zord One"],
      },
      {
        id: 21,
        user: "Chad Lee",
        ranger_color: "Blue",
        ranger_designation: "Blue Lightspeed Rescue Ranger",
        weapon: [
          "Rescue Blaster",
          "Rescue Laser",
          "V-Lancer",
          "Thermo Blaster",
        ],
        season_id: 6,
        joined_date: "2000-02-12",
        status: "Active",
        power_level: 92.8,
        location: "Mariner Bay",
        gear: ["Rescue Morpher", "Battle Booster", "Mega Battle Armor"],
        zord: ["Hydro Rescue Two", "Rail Rescue Two", "Omega Zord Two"],
      },
      {
        id: 22,
        user: "Joel Rawlings",
        ranger_color: "Green",
        ranger_designation: "Green Lightspeed Rescue Ranger",
        weapon: [
          "Rescue Blaster",
          "Rescue Cutter",
          "V-Lancer",
          "Thermo Blaster",
        ],
        season_id: 6,
        joined_date: "2000-02-12",
        status: "Active",
        power_level: 91.2,
        location: "Mariner Bay",
        gear: ["Rescue Morpher", "Battle Booster", "Mega Battle Armor"],
        zord: ["Aero Rescue Three", "Rail Rescue Three", "Omega Zord Three"],
      },
      {
        id: 23,
        user: "Kelsey Winslow",
        ranger_color: "Yellow",
        ranger_designation: "Yellow Lightspeed Rescue Ranger",
        weapon: ["Rescue Blaster", "Rescue Claw", "V-Lancer", "Thermo Blaster"],
        season_id: 6,
        joined_date: "2000-02-12",
        status: "Active",
        power_level: 90.5,
        location: "Mariner Bay",
        gear: ["Rescue Morpher", "Battle Booster"],
        zord: ["HazRescue Four", "Rail Rescue Four", "Omega Zord Four"],
      },
      {
        id: 24,
        user: "Dana Mitchell",
        ranger_color: "Pink",
        ranger_designation: "Pink Lightspeed Rescue Ranger",
        weapon: [
          "Rescue Blaster",
          "Rescue Injector",
          "V-Lancer",
          "Thermo Blaster",
        ],
        season_id: 6,
        joined_date: "2000-02-12",
        status: "Active",
        power_level: 91.8,
        location: "Mariner Bay",
        gear: ["Rescue Morpher", "Battle Booster"],
        zord: ["MedRescue Five", "Rail Rescue Five", "Omega Zord Five"],
      },
      {
        id: 25,
        user: "Ryan Mitchell",
        ranger_color: "Titanium",
        ranger_designation: "Titanium Lightspeed Rescue Ranger",
        weapon: ["Titanium Laser"],
        season_id: 6,
        joined_date: "2000-02-12",
        status: "Active",
        power_level: 94.2,
        location: "Mariner Bay",
        gear: ["Titanium Morpher"],
        zord: ["Max Solarzord"],
      },
    ],
  },
  power_rangers_time_force: {
    tableName: "power_rangers_time_force",
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
        id: 26,
        user: "Jen Scotts",
        ranger_color: "Pink",
        ranger_designation: "Pink Time Force Ranger",
        weapon: ["Chrono Saber", "Chrono Blaster", "V5"],
        season_id: 7,
        joined_date: "2001-02-03",
        status: "Active",
        power_level: 93.5,
        location: "Silver Hills",
        gear: [
          "Chrono Morpher",
          "Visual Scanner",
          "Time Force Badge",
          "Pink Vector Cycle",
        ],
        zord: ["Time Flier 5"],
      },
      {
        id: 27,
        user: "Wesley Collins",
        ranger_color: "Red",
        ranger_designation: "Red Time Force Ranger",
        weapon: ["Chrono Saber", "Chrono Blaster", "V1", "Electro Booster"],
        season_id: 7,
        joined_date: "2001-02-03",
        status: "Active",
        power_level: 96.2,
        location: "Silver Hills",
        gear: [
          "Chrono Morpher",
          "Time Force Badge",
          "Battle Warrior Armor",
          "Strata Cycle",
          "Red Vector Cycle",
        ],
        zord: ["Time Flier 1"],
      },
      {
        id: 28,
        user: "Lucas Kendall",
        ranger_color: "Blue",
        ranger_designation: "Blue Time Force Ranger",
        weapon: ["Chrono Saber", "Chrono Blaster", "V2"],
        season_id: 7,
        joined_date: "2001-02-03",
        status: "Active",
        power_level: 91.8,
        location: "Silver Hills",
        gear: [
          "Chrono Morpher",
          "Visual Scanner",
          "Time Force Badge",
          "Blue Vector Cycle",
        ],
        zord: ["Time Flier 2"],
      },
      {
        id: 29,
        user: "Katie Walker",
        ranger_color: "Yellow",
        ranger_designation: "Yellow Time Force Ranger",
        weapon: ["Chrono Saber", "Chrono Blaster", "V4"],
        season_id: 7,
        joined_date: "2001-02-03",
        status: "Active",
        power_level: 90.7,
        location: "Silver Hills",
        gear: [
          "Chrono Morpher",
          "Visual Scanner",
          "Time Force Badge",
          "Yellow Vector Cycle",
        ],
        zord: ["Time Flier 4"],
      },
      {
        id: 30,
        user: "Trip",
        ranger_color: "Green",
        ranger_designation: "Green Time Force Ranger",
        weapon: ["Chrono Saber", "Chrono Blaster", "V3"],
        season_id: 7,
        joined_date: "2001-02-03",
        status: "Active",
        power_level: 92.1,
        location: "Silver Hills",
        gear: [
          "Chrono Morpher",
          "Visual Scanner",
          "Time Force Badge",
          "Green Vector Cycle",
        ],
        zord: ["Time Flier 3"],
      },
      {
        id: 31,
        user: "Eric Myers",
        ranger_color: "Quantum",
        ranger_designation: "Quantum Ranger",
        weapon: ["Quantum Defender", "Silver Guardian Blaster"],
        season_id: 7,
        joined_date: "2001-02-03",
        status: "Active",
        power_level: 98.5,
        location: "Silver Hills",
        gear: ["Quantum Morpher", "TF Eagle", "Mega Battle Armor"],
        zord: ["Quantasaurus Rex"],
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

const evaluateCondition = (
  row: PowerRanger,
  column: string,
  operator: string,
  value: string,
  table: Table
): boolean => {
  const columnValue = row[column as keyof PowerRanger];
  const columnType = table.columns.find(
    (col: { name: string; type: string; notNull: boolean }) =>
      col.name === column
  )?.type;

  if (operator.toUpperCase() === "LIKE") {
    if (columnType === "text" || columnType === "date") {
      return evaluateLikeCondition(String(columnValue), value);
    } else if (columnType === "text[]") {
      const typedColumnValue = columnValue as string[];
      if (Array.isArray(typedColumnValue)) {
        return typedColumnValue.some((item) =>
          evaluateLikeCondition(item, value)
        );
      }
      return false;
    }
    return false;
  }

  const cleanValue = value.replace(/^'|'$/g, "");
  let typedColumnValue: string | number | string[];
  let typedValue: string | number;

  if (columnType === "integer" || columnType === "float") {
    typedColumnValue = Number(columnValue);
    typedValue = Number(cleanValue);
    if (isNaN(typedColumnValue) || isNaN(typedValue)) {
      return false;
    }
  } else if (columnType === "date" || columnType === "text") {
    typedColumnValue = String(columnValue);
    typedValue = cleanValue;
  } else if (columnType === "text[]") {
    typedColumnValue = columnValue as string[];
    typedValue = cleanValue;

    if (Array.isArray(typedColumnValue)) {
      switch (operator.toUpperCase()) {
        case "=":
          return typedColumnValue.includes(typedValue);
        case "!=":
          return !typedColumnValue.includes(typedValue);
        default:
          return false;
      }
    }
    return false;
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

export default function SqlEditor() {
  const editorRef = useRef<EditorView | null>(null);
  const [result, setResult] = useState<string | null>("");
  const [viewMode, setViewMode] = useState<"json" | "table">("json");
  const [tooltip, setTooltip] = useState<string | null>("");

  const getUniqueValues = useCallback(
    (column: keyof PowerRanger, columnType: string, table: Table): string[] => {
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

  const getLikePatternSuggestions = (
    table: Table,
    column: keyof PowerRanger
  ): string[] => {
    const patterns: string[] = ["'%value%'", "'value%'", "'%value'"];
    const sampleValues = getUniqueValues(column, "string", table)
      .map((val) => val.slice(1, -1))
      .slice(0, 3);
    sampleValues.forEach((val) => {
      if (val.length > 1) {
        patterns.push(`'${val.slice(0, 2)}%'`);
      }
    });
    return patterns;
  };

  const uniqueSeasons = useCallback(() => {
    const seasons = new Set<number>();
    Object.values(tables).forEach((table) => {
      table.data.forEach((row) => {
        seasons.add(row.season_id);
      });
    });
    return Array.from(seasons);
  }, []);

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

      const selectMatch = query.match(
        new RegExp(
          `^select\\s+(.+?)\\s+from\\s+${tableName}(?:\\s+where\\s+(?!.*\\b(?:not\\s+)?exists\\b)(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );

      const selectDistinctMatch = query.match(
        new RegExp(
          `^select\\s+distinct\\s+(.+?)\\s+from\\s+${tableName}(?:\\s+where\\s+(?!.*\\b(?:not\\s+)?exists\\b)(.+?))?(?:\\s+order\\s+by\\s+(\\w+)(?:\\s+(ASC|DESC))?)?(?:\\s+limit\\s+(\\d+))?\\s*;?$`,
          "i"
        )
      );
      const joinMatch = query.match(
        /^SELECT\s+(.+?)\s+FROM\s+([\w]+(?:_[\w]+)*)(?:\s+AS\s+(\w+))?\s+(INNER|LEFT|RIGHT|FULL(?:\s+OUTER)?)\s+JOIN\s+([\w]+(?:_[\w]+)*)(?:\s+AS\s+(\w+))?\s+ON\s+([\w]+(?:_[\w]+)*)\.(\w+)\s*=\s*([\w]+(?:_[\w]+)*)\.(\w+)(?:\s+AND\s+([\w]+(?:_[\w]+)*)\.(\w+)\s*=\s*('[^']*'|[^' ]\w*|\d+(?:\.\d+)?))?(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?\s*;?$/i
      );

      const crossJoinMatch = query.match(
        /^SELECT\s+(.+?)\s+FROM\s+([\w]+(?:_[\w]+)*)(?:\s+AS\s+(\w+))?\s+CROSS\s+JOIN\s+([\w]+(?:_[\w]+)*)(?:\s+AS\s+(\w+))?(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(\w+\.\w+|\w+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?\s*;?$/i
      );

      const unionMatch = query.match(
        /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?\s+(UNION|UNION ALL)\s+SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?\s*;?$/i
      );

      const existsMatch = query.match(
        /^\s*SELECT\s+(.+?)\s+FROM\s+([\w_]+)\s*(?:WHERE\s+(.+?))?\s*(?:ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?)?\s*(?:LIMIT\s+(\d+))?\s*;?\s*$/i
      );
      if (unionMatch) {
        const [
          ,
          firstFieldsRaw,
          firstTableName,
          firstWhereClause,
          unionOperator,
          secondFieldsRaw,
          secondTableName,
          secondWhereClause,
          orderByColumn,
          orderByDirection = "ASC",
          limitValue,
        ] = unionMatch;

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

        if (firstTable.columns.length !== secondTable.columns.length) {
          setResult("Error: UNION tables must have the same number of columns");
          setTooltip(null);
          return false;
        }

        for (let i = 0; i < firstTable.columns.length; i++) {
          if (firstTable.columns[i].type !== secondTable.columns[i].type) {
            setResult(
              `Error: Column ${i + 1} types do not match: ${
                firstTable.columns[i].name
              } (${firstTable.columns[i].type}) vs ${
                secondTable.columns[i].name
              } (${secondTable.columns[i].type})`
            );
            setTooltip(null);
            return false;
          }
        }

        const firstFields = firstFieldsRaw
          .split(/(?<!\([^()]*),(?![^()]*\))/)
          .map((f) => f.trim())
          .filter((f) => f);
        const secondFields = secondFieldsRaw
          .split(/(?<!\([^()]*),(?![^()]*\))/)
          .map((f) => f.trim())
          .filter((f) => f);

        if (firstFields.length !== secondFields.length) {
          setResult(
            "Error: UNION queries must select the same number of columns"
          );
          setTooltip(null);
          return false;
        }

        const fields: Array<{
          name: string;
          table: string;
          alias?: string;
        }> = [];

        for (let i = 0; i < firstFields.length; i++) {
          const field = firstFields[i];
          const asMatch = field.match(/^(.+?)\s+AS\s+(?:(['])(.*?)\2|(\w+))$/i);
          let fieldName = field;
          let alias: string | undefined;
          if (asMatch) {
            fieldName = asMatch[1].trim();
            alias = asMatch[3] || asMatch[4];
          }

          if (
            fieldName !== "*" &&
            !firstTable.columns.some(
              (col) => col.name.toLowerCase() === fieldName.toLowerCase()
            )
          ) {
            setResult(`Error: Invalid field in first SELECT: ${fieldName}`);
            setTooltip(null);
            return false;
          }

          if (
            secondFields[i] !== "*" &&
            !secondTable.columns.some(
              (col) => col.name.toLowerCase() === secondFields[i].toLowerCase()
            )
          ) {
            setResult(
              `Error: Invalid field in second SELECT: ${secondFields[i]}`
            );
            setTooltip(null);
            return false;
          }

          fields.push({
            name: fieldName,
            table: firstTableName,
            alias,
          });
        }

        let firstData = firstTable.data;
        if (firstWhereClause) {
          const conditionParts = firstWhereClause.split(/\s+(AND|OR)\s+/i);
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
                    `Error: Invalid condition in first WHERE clause: ${part}`
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
            if (
              !firstTable.columns.some(
                (col) =>
                  col.name.toLowerCase() === condition.column.toLowerCase()
              )
            ) {
              setResult(
                `Error: Invalid column in first WHERE clause: ${condition.column}`
              );
              setTooltip(null);
              return false;
            }
          }

          firstData = firstData.filter((row) => {
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
                      firstTable
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2,
                      firstTable
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1,
                      firstTable
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

        let secondData = secondTable.data;
        if (secondWhereClause) {
          const conditionParts = secondWhereClause.split(/\s+(AND|OR)\s+/i);
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
                    `Error: Invalid condition in second WHERE clause: ${part}`
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
            if (
              !secondTable.columns.some(
                (col) =>
                  col.name.toLowerCase() === condition.column.toLowerCase()
              )
            ) {
              setResult(
                `Error: Invalid column in second WHERE clause: ${condition.column}`
              );
              setTooltip(null);
              return false;
            }
          }

          secondData = secondData.filter((row) => {
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
                      secondTable
                    );
                  } else if (cond.operator.toUpperCase() === "BETWEEN") {
                    if (!cond.value1 || !cond.value2) return false;
                    return evaluateBetweenCondition(
                      row,
                      cond.column,
                      cond.value1,
                      cond.value2,
                      secondTable
                    );
                  } else {
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column,
                      cond.operator,
                      cond.value1,
                      secondTable
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
          Record<string, string | number | string[] | null>
        > = [];

        const processTableData = (
          data: PowerRanger[],
          table: PowerRangersData,
          selectedFields: string[]
        ) => {
          return data.map((row) => {
            const resultRow: Record<string, string | number | string[] | null> =
              {};
            if (selectedFields.includes("*")) {
              table.columns.forEach((col) => {
                const alias = col.name;
                resultRow[alias] = row[col.name as keyof PowerRanger];
              });
            } else {
              fields.forEach((field, index) => {
                const fieldName = selectedFields[index];
                const alias = field.alias || fieldName;
                resultRow[alias] = row[fieldName as keyof PowerRanger];
              });
            }
            return resultRow;
          });
        };

        resultData = [
          ...processTableData(firstData, firstTable, firstFields),
          ...processTableData(secondData, secondTable, secondFields),
        ];

        if (unionOperator.toUpperCase() === "UNION") {
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
        }

        if (orderByColumn) {
          const columnType = firstTable.columns.find(
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
          setTooltip(null);
          return true;
        } catch {
          setResult("Error: Failed to generate valid JSON output");
          setTooltip(null);
          return false;
        }
      }

      if (crossJoinMatch) {
        const [
          ,
          rawFields,
          firstTableName,
          firstTableAlias,
          secondTableName,
          secondTableAlias,
          whereClause,
          orderByColumn,
          orderByDirection = "ASC",
          limitValue,
        ] = crossJoinMatch;

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
            const resultRow: Record<string, string | number | string[] | null> =
              {};
            fields.forEach((field) => {
              const actualTableName =
                tableMap[field.table.toLowerCase()] ||
                field.table.toLowerCase();
              const key = field.alias || `${field.table}.${field.name}`;
              if (actualTableName === firstTableName.toLowerCase()) {
                resultRow[key] = leftRow[field.name as keyof PowerRanger];
              } else {
                resultRow[key] = rightRow[field.name as keyof PowerRanger];
              }
            });
            resultData.push(resultRow);
          });
        });

        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            table: string;
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
              `${f.table}.${f.name}`.toLowerCase() ===
                orderByColumn.toLowerCase() ||
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

      if (
        !selectMatch &&
        !selectDistinctMatch &&
        !countMatch &&
        !sumMatch &&
        !maxMatch &&
        !avgMatch &&
        !roundMatch &&
        !groupByMatch &&
        !joinMatch &&
        !crossJoinMatch &&
        !unionMatch &&
        !existsMatch
      ) {
        setResult(
          "Error: Query must be 'SHOW TABLES', 'DESCRIBE <table>', or a valid SELECT query with supported clauses (SELECT, DISTINCT, COUNT, SUM, MAX, MIN, AVG, ROUND, GROUP BY, HAVING, WHERE, ORDER BY, LIMIT, INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, FULL JOIN, CROSS JOIN, SELF JOIN, UNION, UNION ALL, EXISTS, NOT EXISTS)"
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
          joinType,
          secondTableName,
          secondTableAlias,
          leftTableOrAlias,
          leftColumn,
          rightTableOrAlias,
          rightColumn,
          onTableOrAlias,
          onColumn,
          onValue,
          whereClause,
          orderByColumn,
          orderByDirection = "ASC",
          limitValue,
        ] = joinMatch;

        const effectiveFirstTableName = firstTableAlias || firstTableName;
        const effectiveSecondTableName = secondTableAlias || secondTableName;

        if (
          firstTableName.toLowerCase() === secondTableName.toLowerCase() &&
          effectiveFirstTableName.toLowerCase() ===
            effectiveSecondTableName.toLowerCase()
        ) {
          setResult("Error: Self join requires distinct table aliases");
          setTooltip(null);
          return false;
        }

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

        if (onTableOrAlias && onColumn && onValue) {
          const actualTableName =
            tableMap[onTableOrAlias.toLowerCase()] ||
            onTableOrAlias.toLowerCase();
          const tableData = tables[actualTableName];
          if (
            !tableData ||
            !tableData.columns.some(
              (col) => col.name.toLowerCase() === onColumn.toLowerCase()
            )
          ) {
            setResult(
              `Error: Invalid column in ON clause: ${onTableOrAlias}.${onColumn}`
            );
            setTooltip(null);
            return false;
          }
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
        const matchedLeftRows = new Set<number>();
        const matchedRightRows = new Set<number>();

        const leftData = firstTable.data;
        const rightData = secondTable.data;

        if (
          joinType.toUpperCase() === "FULL" ||
          joinType.toUpperCase() === "FULL OUTER"
        ) {
          leftData.forEach((leftRow, leftIndex) => {
            rightData.forEach((rightRow, rightIndex) => {
              const leftValue = leftRow[leftColumn as keyof PowerRanger];
              const rightValue = rightRow[rightColumn as keyof PowerRanger];
              let additionalConditionMet = true;

              if (onTableOrAlias && onColumn && onValue) {
                const actualTableName =
                  tableMap[onTableOrAlias.toLowerCase()] ||
                  onTableOrAlias.toLowerCase();
                const value =
                  actualTableName === firstTableName.toLowerCase()
                    ? leftRow[onColumn as keyof PowerRanger]
                    : rightRow[onColumn as keyof PowerRanger];
                const compareValue = onValue.replace(/^'|'$/g, "");
                additionalConditionMet = String(value) === compareValue;
              }

              if (leftValue === rightValue && additionalConditionMet) {
                matchedLeftRows.add(leftIndex);
                matchedRightRows.add(rightIndex);
                const resultRow: Record<
                  string,
                  string | number | string[] | null
                > = {};
                fields.forEach((field) => {
                  const actualTableName =
                    tableMap[field.table.toLowerCase()] ||
                    field.table.toLowerCase();
                  const key = field.alias || `${field.table}.${field.name}`;
                  if (actualTableName === firstTableName.toLowerCase()) {
                    resultRow[key] = leftRow[field.name as keyof PowerRanger];
                  } else {
                    resultRow[key] = rightRow[field.name as keyof PowerRanger];
                  }
                });
                resultData.push(resultRow);
              }
            });
          });

          leftData.forEach((leftRow, leftIndex) => {
            if (!matchedLeftRows.has(leftIndex)) {
              const resultRow: Record<
                string,
                string | number | string[] | null
              > = {};
              fields.forEach((field) => {
                const actualTableName =
                  tableMap[field.table.toLowerCase()] ||
                  field.table.toLowerCase();
                const key = field.alias || `${field.table}.${field.name}`;
                if (actualTableName === firstTableName.toLowerCase()) {
                  resultRow[key] = leftRow[field.name as keyof PowerRanger];
                } else {
                  resultRow[key] = null;
                }
              });
              resultData.push(resultRow);
            }
          });

          rightData.forEach((rightRow, rightIndex) => {
            if (!matchedRightRows.has(rightIndex)) {
              const resultRow: Record<
                string,
                string | number | string[] | null
              > = {};
              fields.forEach((field) => {
                const actualTableName =
                  tableMap[field.table.toLowerCase()] ||
                  field.table.toLowerCase();
                const key = field.alias || `${field.table}.${field.name}`;
                if (actualTableName === secondTableName.toLowerCase()) {
                  resultRow[key] = rightRow[field.name as keyof PowerRanger];
                } else {
                  resultRow[key] = null;
                }
              });
              resultData.push(resultRow);
            }
          });
        } else if (joinType.toUpperCase() === "RIGHT") {
          rightData.forEach((rightRow) => {
            let matched = false;
            leftData.forEach((leftRow) => {
              const leftValue = leftRow[leftColumn as keyof PowerRanger];
              const rightValue = rightRow[rightColumn as keyof PowerRanger];
              let additionalConditionMet = true;

              if (onTableOrAlias && onColumn && onValue) {
                const actualTableName =
                  tableMap[onTableOrAlias.toLowerCase()] ||
                  onTableOrAlias.toLowerCase();
                const value =
                  actualTableName === firstTableName.toLowerCase()
                    ? leftRow[onColumn as keyof PowerRanger]
                    : rightRow[onColumn as keyof PowerRanger];
                const compareValue = onValue.replace(/^'|'$/g, "");
                additionalConditionMet = String(value) === compareValue;
              }

              if (leftValue === rightValue && additionalConditionMet) {
                matched = true;
                const resultRow: Record<
                  string,
                  string | number | string[] | null
                > = {};
                fields.forEach((field) => {
                  const actualTableName =
                    tableMap[field.table.toLowerCase()] ||
                    field.table.toLowerCase();
                  const key = field.alias || `${field.table}.${field.name}`;
                  if (actualTableName === firstTableName.toLowerCase()) {
                    resultRow[key] = leftRow[field.name as keyof PowerRanger];
                  } else {
                    resultRow[key] = rightRow[field.name as keyof PowerRanger];
                  }
                });
                resultData.push(resultRow);
              }
            });

            if (!matched) {
              const resultRow: Record<
                string,
                string | number | string[] | null
              > = {};
              fields.forEach((field) => {
                const actualTableName =
                  tableMap[field.table.toLowerCase()] ||
                  field.table.toLowerCase();
                const key = field.alias || `${field.table}.${field.name}`;
                if (actualTableName === secondTableName.toLowerCase()) {
                  resultRow[key] = rightRow[field.name as keyof PowerRanger];
                } else {
                  resultRow[key] = null;
                }
              });
              resultData.push(resultRow);
            }
          });
        } else {
          leftData.forEach((leftRow) => {
            let matched = false;
            rightData.forEach((rightRow) => {
              const leftValue = leftRow[leftColumn as keyof PowerRanger];
              const rightValue = rightRow[rightColumn as keyof PowerRanger];
              let additionalConditionMet = true;

              if (onTableOrAlias && onColumn && onValue) {
                const actualTableName =
                  tableMap[onTableOrAlias.toLowerCase()] ||
                  onTableOrAlias.toLowerCase();
                const value =
                  actualTableName === firstTableName.toLowerCase()
                    ? leftRow[onColumn as keyof PowerRanger]
                    : rightRow[onColumn as keyof PowerRanger];
                const compareValue = onValue.replace(/^'|'$/g, "");
                additionalConditionMet = String(value) === compareValue;
              }

              if (leftValue === rightValue && additionalConditionMet) {
                matched = true;
                const resultRow: Record<
                  string,
                  string | number | string[] | null
                > = {};
                fields.forEach((field) => {
                  const actualTableName =
                    tableMap[field.table.toLowerCase()] ||
                    field.table.toLowerCase();
                  const key = field.alias || `${field.table}.${field.name}`;
                  if (actualTableName === firstTableName.toLowerCase()) {
                    resultRow[key] = leftRow[field.name as keyof PowerRanger];
                  } else {
                    resultRow[key] = rightRow[field.name as keyof PowerRanger];
                  }
                });
                resultData.push(resultRow);
              }
            });

            if (joinType.toUpperCase() === "LEFT" && !matched) {
              const resultRow: Record<
                string,
                string | number | string[] | null
              > = {};
              fields.forEach((field) => {
                const actualTableName =
                  tableMap[field.table.toLowerCase()] ||
                  field.table.toLowerCase();
                const key = field.alias || `${field.table}.${field.name}`;
                if (actualTableName === firstTableName.toLowerCase()) {
                  resultRow[key] = leftRow[field.name as keyof PowerRanger];
                } else {
                  resultRow[key] = null;
                }
              });
              resultData.push(resultRow);
            }
          });
        }

        if (whereClause) {
          const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
          const conditions: Array<{
            table: string;
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
              `${f.table}.${f.name}`.toLowerCase() ===
                orderByColumn.toLowerCase() ||
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

      if (existsMatch) {
        const [
          ,
          rawFields,
          tableName,
          whereClause,
          orderByColumn,
          orderByDirection = "ASC",
          limitValue,
        ] = existsMatch;

        const mainTable = tables[tableName.toLowerCase()];
        if (!mainTable) {
          setResult(`Error: Table '${tableName}' not found`);
          setTooltip(null);
          return false;
        }

        const fields: Array<{ name: string; alias?: string }> = [];
        const rawFieldsWithAliases = rawFields
          .split(/(?<!\([^()]*),(?![^()]*\))/)
          .map((f) => f.trim())
          .filter((f) => f);

        for (const field of rawFieldsWithAliases) {
          const asMatch = field.match(/^(.+?)\s+as\s+'([^']+)'\s*$/i);
          let fieldName = field;
          let alias: string | undefined;
          if (asMatch) {
            fieldName = asMatch[1].trim();
            alias = asMatch[2];
          }
          if (
            fieldName !== "*" &&
            !mainTable.columns.some(
              (col) => col.name.toLowerCase() === fieldName.toLowerCase()
            )
          ) {
            setResult(`Error: Invalid field: ${fieldName}`);
            setTooltip(null);
            return false;
          }
          fields.push({ name: fieldName, alias: alias || fieldName });
        }

        // Validate fields
        const actualFields = fields
          .map((f) => f.name)
          .flatMap((f) =>
            f === "*" ? mainTable.columns.map((col) => col.name) : [f]
          );
        const invalidFields = actualFields.filter(
          (field) =>
            !mainTable.columns.some(
              (col) => col.name.toLowerCase() === field.toLowerCase()
            )
        );
        if (invalidFields.length > 0) {
          setResult(`Error: Invalid field(s): ${invalidFields.join(", ")}`);
          setTooltip(null);
          return false;
        }

        let filteredData = mainTable.data;
        if (whereClause) {
          const existsSubqueryMatch = whereClause.match(
            /(NOT\s+)?EXISTS\s*\(\s*SELECT\s+\*\s+FROM\s+([\w_]+)\s+WHERE\s+(.+?)\s*\)/i
          );
          if (!existsSubqueryMatch) {
            const conditionParts = whereClause.split(/\s+(AND|OR)\s+/i);
            const conditions: Array<{
              column?: string;
              operator?: string;
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
              if (condition.column) {
                if (
                  !mainTable.columns.some(
                    (col) =>
                      col.name.toLowerCase() === condition.column!.toLowerCase()
                  )
                ) {
                  setResult(
                    `Error: Invalid column in WHERE clause: ${condition.column}`
                  );
                  setTooltip(null);
                  return false;
                }
              }
            }

            filteredData = filteredData.filter((row) => {
              let result = true;
              let currentGroup: Array<{
                column?: string;
                operator?: string;
                value1?: string;
                value2?: string;
              }> = [];
              let lastJoin: "AND" | "OR" | null = null;

              for (const condition of conditions) {
                currentGroup.push(condition);

                if (
                  condition.join ||
                  conditions.indexOf(condition) === conditions.length - 1
                ) {
                  const groupResult = currentGroup.every((cond) => {
                    if (
                      ["IS NULL", "IS NOT NULL"].includes(
                        cond.operator!.toUpperCase()
                      )
                    ) {
                      return evaluateNullCondition(
                        row,
                        cond.column!,
                        cond.operator!,
                        mainTable
                      );
                    }
                    if (cond.operator!.toUpperCase() === "BETWEEN") {
                      if (!cond.value1 || !cond.value2) return false;
                      return evaluateBetweenCondition(
                        row,
                        cond.column!,
                        cond.value1,
                        cond.value2,
                        mainTable
                      );
                    }
                    if (!cond.value1) return false;
                    return evaluateCondition(
                      row,
                      cond.column!,
                      cond.operator!,
                      cond.value1,
                      mainTable
                    );
                  });

                  if (lastJoin === "OR") {
                    result = result || groupResult;
                  } else {
                    result = result && groupResult;
                  }

                  currentGroup = [];
                  lastJoin = condition.join || null;
                }
              }
              return result;
            });
          } else {
            const [, notExists, subTableName, subWhereClause] =
              existsSubqueryMatch;
            const isNotExists = !!notExists;
            const subTable = tables[subTableName.toLowerCase()];
            if (!subTable) {
              setResult(`Error: Subquery table '${subTableName}' not found`);
              setTooltip(null);
              return false;
            }

            const subConditionMatch = subWhereClause.match(
              /^([\w_]+)\.(\w+)\s*=\s*([\w_]+)\.(\w+)$/i
            );
            if (!subConditionMatch) {
              setResult(
                `Error: Invalid subquery WHERE clause: ${subWhereClause}. Expected format: table1.column = table2.column`
              );
              setTooltip(null);
              return false;
            }

            const [subColumn, outerTableAlias, outerColumn] = subConditionMatch;
            if (outerTableAlias.toLowerCase() !== tableName.toLowerCase()) {
              setResult(
                `Error: Subquery must reference main table '${tableName}', got '${outerTableAlias}'`
              );
              setTooltip(null);
              return false;
            }

            if (
              !subTable.columns.some(
                (col) => col.name.toLowerCase() === subColumn.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid subquery column: ${subColumn}`);
              setTooltip(null);
              return false;
            }
            if (
              !mainTable.columns.some(
                (col) => col.name.toLowerCase() === outerColumn.toLowerCase()
              )
            ) {
              setResult(`Error: Invalid outer column: ${outerColumn}`);
              setTooltip(null);
              return false;
            }

            filteredData = filteredData.filter((mainRow) => {
              const outerValue = mainRow[outerColumn as keyof PowerRanger];
              const subResult = subTable.data.some((subRow) => {
                const subValue = subRow[subColumn as keyof PowerRanger];
                return String(subValue) === String(outerValue);
              });
              return isNotExists ? !subResult : subResult;
            });
          }
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
            if (field.name === "*") {
              mainTable.columns.forEach((col) => {
                resultRow[col.name] = row[col.name as keyof PowerRanger];
              });
            } else {
              resultRow[field.alias || field.name] =
                row[field.name as keyof PowerRanger];
            }
          });

          return resultRow;
        });

        if (orderByColumn) {
          const columnType = mainTable.columns.find(
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

    const getSubqueryOptions = (): CompletionOption[] => [
      {
        label: "SELECT",
        type: "keyword",
        apply: "SELECT ",
        detail: "Start a subquery for EXISTS/NOT EXISTS",
        boost: 100,
      },
    ];

    const getSubqueryColumnOptions = (
      tables: { [key: string]: Table },
      availableTables: { name: string; alias?: string }[]
    ): CompletionOption[] => {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(...getColumnOptions([], tables[name], alias));
        }
      });
      return options;
    };

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

    const validateUnion = (
      tablesInQuery: { name: string; alias?: string }[]
    ): CompletionOption[] => {
      const warnings: CompletionOption[] = [];
      if (tablesInQuery.length > 1) {
        const firstTable = tables[tablesInQuery[0].name];
        const columnCount = firstTable?.columns.length;
        const firstTableColumns = firstTable?.columns || [];

        for (let i = 1; i < tablesInQuery.length; i++) {
          const secondTable = tables[tablesInQuery[i].name];
          if (!secondTable) continue;

          if (secondTable.columns.length !== columnCount) {
            warnings.push({
              label: "",
              type: "text",
              apply: "",
              detail: `Warning: Table ${secondTable.tableName} has ${secondTable.columns.length} columns, but ${firstTable.tableName} has ${columnCount} columns. UNION/UNION ALL requires same number of columns.`,
            });
            continue;
          }

          for (let j = 0; j < columnCount; j++) {
            const firstColType = firstTableColumns[j].type;
            const currColType = secondTable.columns[j].type;
            if (firstColType !== currColType) {
              warnings.push({
                label: "",
                type: "text",
                apply: "",
                detail: `Warning: Column ${j + 1} in ${
                  secondTable.tableName
                } (type: ${currColType}) is incompatible with ${
                  firstTable.tableName
                } (type: ${firstColType}). UNION/UNION ALL requires compatible data types.`,
              });
            }
          }
        }
      }
      return warnings;
    };

    const tableMatches = fullDocText.matchAll(
      /from\s+(\w+)(?:\s+(\w+))?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+(\w+)(?:\s+(\w+))?)*\s*(?:(?:(?:union|union all)\s+select\s+\*?\s+from\s+(\w+)(?:\s+(\w+))?)?)*/gi
    );
    const tablesInQuery: { name: string; alias?: string }[] = [];
    for (const match of tableMatches) {
      tablesInQuery.push({
        name: match[1].toLowerCase(),
        alias: match[2]?.toLowerCase(),
      });
      if (match[4]) {
        tablesInQuery.push({
          name: match[4].toLowerCase(),
          alias: match[5]?.toLowerCase(),
        });
      }
      if (match[6]) {
        tablesInQuery.push({
          name: match[6].toLowerCase(),
          alias: match[7]?.toLowerCase(),
        });
      }
    }

    const availableTables =
      tablesInQuery.length > 0
        ? tablesInQuery
        : Object.keys(tables).map((name) => ({ name, alias: undefined }));

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
                .replace(/^(\w+)\.(\w+)$/, "$2")
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

    // 3. After SELECT, suggest columns from all tables, *, aggregates, DISTINCT, CASE
    if (/^select\s*$/i.test(docText)) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(
            ...getColumnOptions(alreadySelectedFields, tables[name], alias)
          );
        }
      });
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
        }
      );
      availableTables.forEach(({ name }) => {
        if (tables[name]) {
          options.push(...getAggregateOptions(tables[name]));
        }
      });
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 4. After SELECT DISTINCT, suggest columns from all tables
    if (/^select\s+distinct\s*$/i.test(docText)) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(
            ...getColumnOptions(alreadySelectedFields, tables[name], alias)
          );
        }
      });
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 5. After comma in SELECT, suggest remaining columns and aggregates from all tables
    if (
      /^select\s+(?:distinct\s+)?[\w\s,\.'*]+$/i.test(docText) &&
      /,\s*$/.test(docText.substring(0, cursorPos)) &&
      !docText.includes("from")
    ) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(
            ...getColumnOptions(alreadySelectedFields, tables[name], alias)
          );
          options.push(...getAggregateOptions(tables[name]));
        }
      });
      options.push({
        label: "CASE",
        type: "keyword",
        apply: "CASE ",
        detail: "Conditional logic",
      });
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 6. After a field or aggregate, suggest , AS, FROM, GROUP BY, UNION
    if (
      /^select\s+(?:distinct\s+)?(?:[\w*\.]+|(?:count|sum|max|min|avg|round)\s*\((?:[\w*]+|\*|\([^)]+\))(?:,\s*\d+)?\)(?:\s+as\s+'.*?')?)(?:\s*,\s*(?:[\w*\.]+|(?:count|sum|max|min|avg|round)\s*\((?:[\w*]+|\*|\([^)]+\))(?:,\s*\d+)?\)(?:\s+as\s+'.*?')?))*\s*$/i.test(
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
        const fieldMatch = lastFieldClean.match(/^(\w+)\.(\w+)$/i);
        const isAggregate =
          /^(count|sum|max|min|avg|round)\s*\((?:[\w*]+|\*|\([^)]+\))(?:,\s*\d+)?\)$/i.test(
            lastFieldClean
          );
        const isNestedAggregate =
          /^round\s*\(\s*avg\s*\(\w+\)\s*(?:,\s*\d+)?\)$/i.test(lastFieldClean);
        const isColumn = fieldMatch
          ? availableTables.some(({ name, alias }) =>
              tables[name]?.columns.some(
                (col) =>
                  col.name.toLowerCase() === fieldMatch[2].toLowerCase() &&
                  (fieldMatch[1].toLowerCase() === name ||
                    fieldMatch[1].toLowerCase() === alias)
              )
            )
          : lastFieldClean.toLowerCase() === "*" ||
            availableTables.some(({ name }) =>
              tables[name]?.columns.some(
                (col) => col.name.toLowerCase() === lastFieldClean.toLowerCase()
              )
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
            : lastFieldClean.toLowerCase() === "*" || fieldMatch
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
            {
              label: "UNION",
              type: "keyword",
              apply: " UNION ",
              detail: "Combine with another SELECT query (removes duplicates)",
            },
            {
              label: "UNION ALL",
              type: "keyword",
              apply: " UNION ALL ",
              detail: "Combine with another SELECT query (keeps duplicates)",
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

          options.push(...validateUnion(tablesInQuery));
          return { from: cursorPos, options };
        }
      }
    }

    // 7. After AS 'alias', suggest , FROM, GROUP BY, UNION
    if (/as\s*'.*?'\s*$/i.test(docText) && !docText.includes("from")) {
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
        {
          label: "UNION",
          type: "keyword",
          apply: " UNION ",
          detail: "Combine with another SELECT query (removes duplicates)",
        },
        {
          label: "UNION ALL",
          type: "keyword",
          apply: " UNION ALL ",
          detail: "Combine with another SELECT query (keeps duplicates)",
        },
      ];
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 8. After FROM, suggest table names
    if (/from\s*$/i.test(docText)) {
      const options: CompletionOption[] = Object.keys(tables).map(
        (tableName) => ({
          label: tableName,
          type: "table",
          apply: tableName + " ",
          detail: "Table name",
        })
      );
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 9. After UNION or UNION ALL, suggest SELECT
    if (
      /\b(union|union all)\s*$/i.test(
        fullDocText.substring(0, cursorPos).trimEnd()
      )
    ) {
      const options: CompletionOption[] = [
        {
          label: "SELECT",
          type: "keyword",
          apply: "SELECT ",
          detail: "Start second SELECT for UNION/UNION ALL",
          boost: 100,
        },
      ];
      if (tablesInQuery.length > 1) {
        options.push(...validateUnion(tablesInQuery));
      }
      return { from: cursorPos, options };
    }

    // 10. After FROM table_name, suggest INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN, WHERE, GROUP BY, ORDER BY, LIMIT, UNION
    if (
      new RegExp(`from\\s+(\\w+)(?:\\s+(\\w+))?\\s*$`, "i").test(docText) &&
      !/where\s*$/i.test(docText)
    ) {
      const tableNameMatch = docText.match(/from\s+(\w+)(?:\s+(\w+))?\s*$/i);
      if (tableNameMatch) {
        const tableName = tableNameMatch[1].toLowerCase();
        if (tables[tableName]) {
          const options: CompletionOption[] = [
            {
              label: "INNER JOIN",
              type: "keyword",
              apply: " INNER JOIN ",
              detail:
                "Join with another table (including self-join), returning matching rows",
            },
            {
              label: "LEFT JOIN",
              type: "keyword",
              apply: " LEFT JOIN ",
              detail:
                "Join with another table (including self-join), keeping all rows from the left table",
            },
            {
              label: "RIGHT JOIN",
              type: "keyword",
              apply: " RIGHT JOIN ",
              detail:
                "Join with another table (including self-join), keeping all rows from the right table",
            },
            {
              label: "FULL OUTER JOIN",
              type: "keyword",
              apply: " FULL OUTER JOIN ",
              detail:
                "Join with another table (including self-join), keeping all rows from both tables",
            },
            {
              label: "CROSS JOIN",
              type: "keyword",
              apply: " CROSS JOIN ",
              detail:
                "Combine all rows from both tables (including self-join, Cartesian product)",
            },
            {
              label: "WHERE",
              type: "keyword",
              apply: " WHERE ",
              detail: "Filter rows",
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
            {
              label: "UNION",
              type: "keyword",
              apply: " UNION ",
              detail: "Combine with another SELECT query (removes duplicates)",
            },
            {
              label: "UNION ALL",
              type: "keyword",
              apply: " UNION ALL ",
              detail: "Combine with another SELECT query (keeps duplicates)",
            },
          ];
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 11. After UNION SELECT or UNION ALL SELECT, suggest columns from all tables, *, aggregates, DISTINCT, CASE
    if (/(?:union|union all)\s+select\s*$/i.test(docText)) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(
            ...getColumnOptions(alreadySelectedFields, tables[name], alias)
          );
        }
      });
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
        }
      );
      availableTables.forEach(({ name }) => {
        if (tables[name]) {
          options.push(...getAggregateOptions(tables[name]));
        }
      });
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 12. After UNION SELECT fields or UNION ALL SELECT fields, suggest , FROM
    if (
      /(?:union|union all)\s+select\s+(?:[\w*\.]+|(?:count|sum|max|min|avg|round)\s*\((?:[\w*]+|\*|\([^)]+\))(?:,\s*\d+)?\)(?:\s+as\s+'.*?')?)(?:\s*,\s*(?:[\w*\.]+|(?:count|sum|max|min|avg|round)\s*\((?:[\w*]+|\*|\([^)]+\))(?:,\s*\d+)?\)(?:\s+as\s+'.*?')?))*\s*$/i.test(
        docText
      ) &&
      !docText.includes("from", docText.lastIndexOf("union"))
    ) {
      const fieldsBeforeCursor = fullDocText
        .substring(fullDocText.toLowerCase().lastIndexOf("union"))
        .match(/^(?:union|union all)\s+select\s+(.+)$/i)?.[1];
      if (fieldsBeforeCursor) {
        const fields = fieldsBeforeCursor
          .split(/(?<!\([^()]*),(?![^()]*\))/g)
          .map((field) => field.trim())
          .filter((f) => f);

        const lastField = fields[fields.length - 1] || "";
        const lastFieldClean = lastField.replace(/\s+as\s+'.*?'$/i, "").trim();
        const fieldMatch = lastFieldClean.match(/^(\w+)\.(\w+)$/i);
        const isAggregate =
          /^(count|sum|max|min|avg|round)\s*\((?:[\w*]+|\*|\([^)]+\))(?:,\s*\d+)?\)$/i.test(
            lastFieldClean
          );
        const isNestedAggregate =
          /^round\s*\(\s*avg\s*\(\w+\)\s*(?:,\s*\d+)?\)$/i.test(lastFieldClean);
        const isColumn = fieldMatch
          ? availableTables.some(({ name, alias }) =>
              tables[name]?.columns.some(
                (col) =>
                  col.name.toLowerCase() === fieldMatch[2].toLowerCase() &&
                  (fieldMatch[1].toLowerCase() === name ||
                    fieldMatch[1].toLowerCase() === alias)
              )
            )
          : lastFieldClean.toLowerCase() === "*" ||
            availableTables.some(({ name }) =>
              tables[name]?.columns.some(
                (col) => col.name.toLowerCase() === lastFieldClean.toLowerCase()
              )
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
            : lastFieldClean.toLowerCase() === "*" || fieldMatch
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
          ];

          if (!hasAlias && formattedAlias) {
            options.unshift({
              label: "AS",
              type: "keyword",
              apply: ` AS '${formattedAlias}' `,
              detail: "Alias the column",
            });
          }

          options.push(...validateUnion(tablesInQuery));
          return { from: cursorPos, options };
        }
      }
    }

    // 13. After UNION SELECT fields AS 'alias', suggest , FROM
    if (
      /union\s+select\s+.*?\s+as\s+'.*?'\s*$/i.test(docText) &&
      !docText.includes("from", docText.lastIndexOf("union"))
    ) {
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
      ];
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 14. After UNION SELECT * FROM or UNION ALL SELECT * FROM, suggest table names
    if (/(?:union|union all)\s+select\s+\*\s+from\s*$/i.test(docText)) {
      const options: CompletionOption[] = Object.keys(tables).map(
        (tableName) => ({
          label: tableName,
          type: "table",
          apply: tableName + " ",
          detail: "Table name",
        })
      );
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 15. After UNION SELECT * FROM table_name, suggest ORDER BY, LIMIT, or another UNION
    if (/union\s+select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s*$/i.test(docText)) {
      const tableNameMatch = docText.match(
        /union\s+select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s*$/i
      );
      if (tableNameMatch) {
        const tableName = tableNameMatch[1].toLowerCase();
        if (tables[tableName]) {
          const options: CompletionOption[] = [
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
            {
              label: "UNION",
              type: "keyword",
              apply: " UNION ",
              detail: "Combine with another SELECT query (removes duplicates)",
            },
            {
              label: "UNION ALL",
              type: "keyword",
              apply: " UNION ALL ",
              detail: "Combine with another SELECT query (keeps duplicates)",
            },
          ];
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 16. After CROSS JOIN, suggest all table names (including self-join)
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+cross\\s+join\\s*(\\w*)$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+cross\s+join\s*(\w*)$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const partialTable = match[3].toLowerCase();
        if (tables[firstTable]) {
          const filteredTables = Object.keys(tables).filter((tableName) =>
            tableName.toLowerCase().startsWith(partialTable)
          );
          const options: CompletionOption[] = filteredTables.map(
            (tableName) => ({
              label: tableName,
              type: "table",
              apply: tableName + " ",
              detail: `Table name${
                tableName.toLowerCase() === firstTable ? " (self-join)" : ""
              }`,
            })
          );
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 17. After CROSS JOIN table_name, suggest WHERE, GROUP BY, ORDER BY, or LIMIT
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+cross\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+cross\s+join\s+(\w+)(?:\s+(\w+))?\s*$/i
      );
      if (
        match &&
        tables[match[1].toLowerCase()] &&
        tables[match[3].toLowerCase()]
      ) {
        const options: CompletionOption[] = [
          {
            label: "WHERE",
            type: "keyword",
            apply: " WHERE ",
            detail: "Filter rows",
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
        ];
        options.push(...validateUnion(tablesInQuery));
        return { from: word?.from ?? cursorPos, options };
      }
    }

    // 18. After GROUP BY, suggest columns or numeric references from all tables
    if (/group\s+by\s*$/i.test(docText)) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(
            ...getColumnOptions(alreadySelectedFields, tables[name], alias)
          );
        }
      });
      options.push(
        ...selectFields.map(({ field, index }) => ({
          label: `${index}`,
          type: "value",
          apply: `${index}`,
          detail: `Reference to ${field}`,
        }))
      );
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 19. After GROUP BY column or number, suggest comma, remaining columns/numbers, HAVING, ORDER BY, or LIMIT
    if (
      /group\s+by\s+(?:\w+\.\w+|\d+)(?:\s*,\s*(?:\w+\.\w+|\d+))*\s*$/i.test(
        docText
      )
    ) {
      const groupByMatch = docText.match(/group\s+by\s+(.+)/i);
      const usedFields = groupByMatch
        ? groupByMatch[1]
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f)
        : [];
      const options: CompletionOption[] = [
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
      ];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          const availableColumns = tables[name].columns.filter(
            (col) =>
              !usedFields.includes(
                `${alias || name}.${col.name.toLowerCase()}`
              ) && !usedFields.includes(col.name.toLowerCase())
          );
          options.push(
            ...availableColumns.map((col) => ({
              label: `${alias || name}.${col.name}`,
              type: "field",
              apply: `${alias || name}.${col.name}`,
              detail: `${col.type}, ${col.notNull ? "not null" : "nullable"}`,
            }))
          );
        }
      });
      const availableSelectFields = selectFields.filter(
        ({ index }) => !usedFields.includes(`${index}`)
      );
      options.push(
        ...availableSelectFields.map(({ field, index }) => ({
          label: `${index}`,
          type: "value",
          apply: `${index}`,
          detail: `Reference to ${field}`,
        }))
      );
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 20. After WHERE with conditions, AND, or OR, suggest columns, EXISTS, and NOT EXISTS
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s*(?:(inner|left|right|full(?:\\s+outer)?|cross)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?)*\\s+where\\s+[\\w\\.'=<>!\\s]+\\s*(?:(and|or)\\s*)?$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s*(?:(inner|left|right|full(?:\s+outer)?|cross)\s+join\s+(\w+)(?:\s+(\w+))?)*\s+where\s+([\w\.'=<>!\s]+)(?:\s+(?:and|or)\s*)?$/i
      );
      const options: CompletionOption[] = [];
      if (match) {
        const whereClause = match[6] || "";
        availableTables.forEach(({ name, alias }) => {
          if (tables[name]) {
            const usedColumns = getUsedColumnsInWhere(
              whereClause,
              tables[name]
            );
            options.push(...getColumnOptions(usedColumns, tables[name], alias));
          }
        });
        options.push(
          {
            label: "EXISTS",
            type: "keyword",
            apply: "EXISTS (",
            detail: "Check for existence of rows in subquery",
            boost: 90,
          },
          {
            label: "NOT EXISTS",
            type: "keyword",
            apply: "NOT EXISTS (",
            detail: "Check for non-existence of rows in subquery",
            boost: 90,
          }
        );
      }
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 21. After a complete WHERE condition, suggest AND, OR, GROUP BY, ORDER BY, or LIMIT
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s*(?:(inner|left|right|full(?:\\s+outer)?|cross)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?)?\\s+where\\s+.*?(?:\\w+\\.\\w+\\s*(=|\\!=|>|<|>=|<=|LIKE)\\s*('[^']*'|[^' ]\\w*)|\\w+\\.\\w+\\s*BETWEEN\\s*('[^']*'|[^' ]\\w*)\\s*AND\\s*('[^']*'|[^' ]\\w*)|\\w+\\.\\w+\\s*(IS NULL|IS NOT NULL))\\s*$`,
        "i"
      ).test(docText)
    ) {
      const options: CompletionOption[] = [
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
      ];
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 22. After WHERE table.column, suggest operators
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s*(?:(inner|left|right|full(?:\\s+outer)?|cross)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?)?\\s+where\\s+.*?\\b(\\w+)\\.(\\w+)\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s*(?:(inner|left|right|full(?:\s+outer)?|cross)\s+join\s+(\w+)(?:\s+(\w+))?)?\s+where\s+.*?\b(\w+)\.(\w+)\s*$/i
      );
      if (match) {
        const tableOrAlias = match[6].toLowerCase();
        const columnName = match[7].toLowerCase();
        const targetTable = availableTables.find(
          ({ name, alias }) => tableOrAlias === name || tableOrAlias === alias
        );
        if (
          targetTable &&
          tables[targetTable.name]?.columns.some(
            (col) => col.name.toLowerCase() === columnName
          )
        ) {
          const options: CompletionOption[] = [
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
          ];
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 23. After WHERE table.column operator, suggest values
    const valuePattern = new RegExp(
      `from\\s+(\\w+)(?:\\s+(\\w+))?\\s*(?:(inner|left|right|full(?:\\s+outer)?|cross)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?)?\\s+where\\s+(?:.*?\\s+(?:and|or)\\s+)?(\\w+)\\.(\\w+)\\s*(=|\\!=|>|<|>=|<=|LIKE|BETWEEN)\\s*(?:('[^']*'|[^' ]\\w*)?)?$`,
      "i"
    );
    if (valuePattern.test(docText)) {
      const match = docText.match(valuePattern);
      if (match) {
        const tableOrAlias = match[6].toLowerCase();
        const column = match[7];
        const operator = match[8];
        const value1 = match[9];
        const targetTable = availableTables.find(
          ({ name, alias }) => tableOrAlias === name || tableOrAlias === alias
        );
        if (
          targetTable &&
          tables[targetTable.name]?.columns.some(
            (col) => col.name.toLowerCase() === column?.toLowerCase()
          )
        ) {
          const columnDef = tables[targetTable.name].columns.find(
            (col) => col.name.toLowerCase() === column?.toLowerCase()
          );
          if (
            columnDef &&
            (column as keyof PowerRanger) in tables[targetTable.name].data[0]
          ) {
            const columnType = columnDef.type;

            if (operator.toUpperCase() === "BETWEEN") {
              const sampleValues = getUniqueValues(
                column as keyof PowerRanger,
                columnType,
                tables[targetTable.name]
              );
              const options: CompletionOption[] = sampleValues.map((value) => ({
                label: value,
                type: "value",
                apply: value + (value1 ? "" : " AND "),
                detail: value1
                  ? "Second value for BETWEEN"
                  : "First value for BETWEEN",
              }));
              options.push(...validateUnion(tablesInQuery));
              return { from: word?.from ?? cursorPos, options };
            }

            if (operator.toUpperCase() === "LIKE") {
              const likePatterns = getLikePatternSuggestions(
                tables[targetTable.name],
                column as keyof PowerRanger
              );
              const options: CompletionOption[] = likePatterns.map(
                (pattern) => ({
                  label: pattern,
                  type: "value",
                  apply: pattern,
                  detail: "LIKE pattern",
                })
              );
              options.push(...validateUnion(tablesInQuery));
              return { from: word?.from ?? cursorPos, options };
            }

            if (["IS NULL", "IS NOT NULL"].includes(operator.toUpperCase())) {
              return null;
            }

            const sampleValues = getUniqueValues(
              column as keyof PowerRanger,
              columnType,
              tables[targetTable.name]
            );
            const options: CompletionOption[] = sampleValues.map((value) => ({
              label: value,
              type: "value",
              apply: value,
              detail: "Value",
            }));
            options.push(...validateUnion(tablesInQuery));
            return { from: word?.from ?? cursorPos, options };
          }
        }
      }
    }

    // 24. After AND or OR, suggest remaining columns from all tables
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s*(?:(inner|left|right|full(?:\\s+outer)?|cross)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?)?\\s+where\\s+.*?\\s+(and|or)\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s*(?:(inner|left|right|full(?:\s+outer)?|cross)\s+join\s+(\w+)(?:\s+(\w+))?)?\s+where\s+(.+?)\s+(?:and|or)\s*$/i
      );
      if (match) {
        const whereClause = match[6] || "";
        const options: CompletionOption[] = [];
        availableTables.forEach(({ name, alias }) => {
          if (tables[name]) {
            const usedColumns = getUsedColumnsInWhere(
              whereClause,
              tables[name]
            );
            options.push(...getColumnOptions(usedColumns, tables[name], alias));
          }
        });
        options.push(...validateUnion(tablesInQuery));
        return { from: word?.from ?? cursorPos, options };
      }
    }

    // 25. Suggest number after LIMIT
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+\\w+)?\\s*(?:(inner|left|right|full(?:\\s+outer)?|cross)\\s+join\\s+(\\w+)(?:\\s+\\w+)?)?\\s+(?:where\\s+.*?\\s+)?(?:group\\s+by\\s+.*?\\s+)?(?:order\\s+by\\s+.*?\\s+)?limit\\s*$`,
        "i"
      ).test(docText)
    ) {
      const options: CompletionOption[] = [
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
      }));
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 26. After ROUND(column, suggest decimal places)
    if (/^select\s+round\s*\(\w+\.\w+,\s*$/i.test(docText)) {
      const options: CompletionOption[] = ["0", "1", "2", "3", "4"].map(
        (num) => ({
          label: num,
          type: "value",
          apply: `${num})`,
          detail: `Round to ${num} decimal place${num === "1" ? "" : "s"}`,
        })
      );
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 27. After ORDER BY, suggest columns from all tables
    if (/order\s+by\s*$/i.test(docText)) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(...getColumnOptions([], tables[name], alias));
        }
      });
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 28. After ORDER BY table.column, suggest ASC, DESC, or LIMIT
    if (/order\s+by\s+\w+\.\w+\s*$/i.test(docText)) {
      const orderByColumnMatch = docText.match(
        /order\s+by\s+(\w+)\.(\w+)\s*$/i
      );
      if (orderByColumnMatch) {
        const tableOrAlias = orderByColumnMatch[1].toLowerCase();
        const columnName = orderByColumnMatch[2].toLowerCase();
        const targetTable = availableTables.find(
          ({ name, alias }) => tableOrAlias === name || tableOrAlias === alias
        );
        if (
          targetTable &&
          tables[targetTable.name]?.columns.some(
            (col) => col.name.toLowerCase() === columnName
          )
        ) {
          const options: CompletionOption[] = [
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
          ];
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 29. After GROUP BY columns, suggest HAVING, ORDER BY, or LIMIT
    if (
      /group\s+by\s+(?:\w+\.\w+|\d+)(?:\s*,\s*(?:\w+\.\w+|\d+))*\s*$/i.test(
        docText
      )
    ) {
      const groupByMatch = docText.match(/group\s+by\s+(.+)/i);
      const usedFields = groupByMatch
        ? groupByMatch[1]
            .split(",")
            .map((f) => f.trim())
            .filter((f) => f)
        : [];
      const options: CompletionOption[] = [
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
      ];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          const availableColumns = tables[name].columns.filter(
            (col) =>
              !usedFields.includes(
                `${alias || name}.${col.name.toLowerCase()}`
              ) && !usedFields.includes(col.name.toLowerCase())
          );
          options.push(
            ...availableColumns.map((col) => ({
              label: `${alias || name}.${col.name}`,
              type: "field",
              apply: `${alias || name}.${col.name}`,
              detail: `${col.type}, ${col.notNull ? "not null" : "nullable"}`,
            }))
          );
        }
      });
      const availableSelectFields = selectFields.filter(
        ({ index }) => !usedFields.includes(`${index}`)
      );
      options.push(
        ...availableSelectFields.map(({ field, index }) => ({
          label: `${index}`,
          type: "value",
          apply: `${index}`,
          detail: `Reference to ${field}`,
        }))
      );
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 30. After HAVING, suggest aggregate functions for all tables
    if (/having\s*$/i.test(docText)) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name }) => {
        if (tables[name]) {
          options.push(...getAggregateOptions(tables[name]));
        }
      });
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 31. After HAVING aggregate, suggest operators
    if (
      /having\s*(count|sum|max|min|avg)\s*\((?:[*]|\w+\.\w+)\)\s*$/i.test(
        docText
      )
    ) {
      const options: CompletionOption[] = [
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
      ];
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 32. After HAVING aggregate operator, suggest numeric values
    if (
      /having\s*(count|sum|max|min|avg)\s*\((?:[*]|\w+\.\w+)\)\s*(=|\!=|>|<|>=|<=)\s*$/i.test(
        docText
      )
    ) {
      const options: CompletionOption[] = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "10",
        "15",
        "20",
      ].map((num) => ({
        label: num,
        type: "value",
        apply: num,
        detail: `Value ${num}`,
      }));
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 33. After CASE, suggest WHEN
    if (/^select\s+.*?\bcase\s*$/i.test(docText)) {
      const options: CompletionOption[] = [
        {
          label: "WHEN",
          type: "keyword",
          apply: "WHEN ",
          detail: "Start a condition",
        },
      ];
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 34. After CASE WHEN, suggest columns from all tables
    if (/^select\s+.*?\bcase\s+when\s*$/i.test(docText)) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(...getColumnOptions([], tables[name], alias));
        }
      });
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 35. After CASE WHEN table.column, suggest operators
    if (/^select\s+.*?\bcase\s+when\s+\w+\.\w+\s*$/i.test(docText)) {
      const match = docText.match(
        /^select\s+.*?\bcase\s+when\s+(\w+)\.(\w+)\s*$/i
      );
      if (match) {
        const tableOrAlias = match[1].toLowerCase();
        const columnName = match[2].toLowerCase();
        const targetTable = availableTables.find(
          ({ name, alias }) => tableOrAlias === name || tableOrAlias === alias
        );
        if (
          targetTable &&
          tables[targetTable.name]?.columns.some(
            (col) => col.name.toLowerCase() === columnName
          )
        ) {
          const options: CompletionOption[] = [
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
          ];
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 36. After CASE WHEN table.column operator, suggest values
    const caseValuePattern =
      /^select\s+.*?\bcase\s+when\s+(\w+)\.(\w+)\s*(=|\!=|>|<|>=|<=|LIKE|BETWEEN)\s*(?:('[^']*'|[^' ]\w*)?)?$/i;
    if (caseValuePattern.test(docText)) {
      const match = docText.match(caseValuePattern);
      if (match) {
        const tableOrAlias = match[1].toLowerCase();
        const column = match[2];
        const operator = match[3];
        const value1 = match[4];
        const targetTable = availableTables.find(
          ({ name, alias }) => tableOrAlias === name || tableOrAlias === alias
        );
        if (
          targetTable &&
          tables[targetTable.name]?.columns.some(
            (col) => col.name.toLowerCase() === column?.toLowerCase()
          )
        ) {
          const columnDef = tables[targetTable.name].columns.find(
            (col) => col.name.toLowerCase() === column?.toLowerCase()
          );
          if (
            columnDef &&
            (column as keyof PowerRanger) in tables[targetTable.name].data[0]
          ) {
            const columnType = columnDef.type;

            if (operator.toUpperCase() === "BETWEEN") {
              const sampleValues = getUniqueValues(
                column as keyof PowerRanger,
                columnType,
                tables[targetTable.name]
              );
              const options: CompletionOption[] = sampleValues.map((value) => ({
                label: value,
                type: "value",
                apply: value + (value1 ? "" : " AND "),
                detail: value1
                  ? "Second value for BETWEEN"
                  : "First value for BETWEEN",
              }));
              options.push(...validateUnion(tablesInQuery));
              return { from: word?.from ?? cursorPos, options };
            }

            if (operator.toUpperCase() === "LIKE") {
              const likePatterns = getLikePatternSuggestions(
                tables[targetTable.name],
                column as keyof PowerRanger
              );
              const options: CompletionOption[] = likePatterns.map(
                (pattern) => ({
                  label: pattern,
                  type: "value",
                  apply: pattern,
                  detail: "LIKE pattern",
                })
              );
              options.push(...validateUnion(tablesInQuery));
              return { from: word?.from ?? cursorPos, options };
            }

            if (["IS NULL", "IS NOT NULL"].includes(operator.toUpperCase())) {
              const options: CompletionOption[] = [
                {
                  label: "THEN",
                  type: "keyword",
                  apply: " THEN ",
                  detail: "Specify output for condition",
                },
              ];
              options.push(...validateUnion(tablesInQuery));
              return { from: word?.from ?? cursorPos, options };
            }

            const sampleValues = getUniqueValues(
              column as keyof PowerRanger,
              columnType,
              tables[targetTable.name]
            );
            const options: CompletionOption[] = sampleValues.map((value) => ({
              label: value,
              type: "value",
              apply: value + " ",
              detail: "Value",
            }));
            options.push(...validateUnion(tablesInQuery));
            return { from: word?.from ?? cursorPos, options };
          }
        }
      }
    }

    // 37. After THEN, suggest values or columns
    if (/^select\s+.*?\bcase\s+when\s+.*?\s+then\s*$/i.test(docText)) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(...getColumnOptions([], tables[name], alias));
        }
      });
      options.push(
        ...["'value'", "'true'", "'false'", "'output'"].map((val) => ({
          label: val,
          type: "value",
          apply: val + " ",
          detail: "Output value",
        }))
      );
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 38. After THEN value or ELSE value, suggest WHEN, ELSE, or END
    if (
      /^select\s+.*?\bcase\s+when\s+.*?\s+then\s*('[^']*'|[^' ]\w*)\s*$/i.test(
        docText
      ) ||
      /^select\s+.*?\bcase\s+when\s+.*?\s+else\s*('[^']*'|[^' ]\w*)\s*$/i.test(
        docText
      )
    ) {
      const options: CompletionOption[] = [
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
      ];
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 39. After ELSE, suggest values or columns
    if (/^select\s+.*?\bcase\s+when\s+.*?\s+else\s*$/i.test(docText)) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(...getColumnOptions([], tables[name], alias));
        }
      });
      options.push(
        ...["'value'", "'true'", "'false'", "'output'"].map((val) => ({
          label: val,
          type: "value",
          apply: val + " ",
          detail: "Default output value",
        }))
      );
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 40. After END, suggest AS, comma, or FROM
    if (/^select\s+.*?\bcase\s+when\s+.*?\s+end\s*$/i.test(docText)) {
      const options: CompletionOption[] = [
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
      ];
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 41. After END AS 'alias', suggest comma or FROM
    if (
      /^select\s+.*?\bcase\s+when\s+.*?\s+end\s+as\s+'.*?'\s*$/i.test(docText)
    ) {
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
      ];
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 42. After INNER JOIN, LEFT JOIN, RIGHT JOIN, or FULL OUTER JOIN, suggest all table names (including self-join)
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+(inner|left|right|full(?:\\s+outer)?)\\s+join\\s*(\\w*)$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+(inner|left|right|full(?:\s+outer)?)\s+join\s*(\w*)$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const partialTable = match[3].toLowerCase();
        if (tables[firstTable]) {
          const filteredTables = Object.keys(tables).filter((tableName) =>
            tableName.toLowerCase().startsWith(partialTable)
          );
          const options: CompletionOption[] = filteredTables.map(
            (tableName) => ({
              label: tableName,
              type: "table",
              apply: tableName + " ",
              detail: `Table name${
                tableName.toLowerCase() === firstTable ? " (self-join)" : ""
              }`,
            })
          );
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 43. After INNER JOIN, LEFT JOIN, RIGHT JOIN, or FULL OUTER JOIN table_name, suggest ON
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+(inner|left|right|full(?:\\s+outer)?)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s*$`,
        "i"
      ).test(docText) &&
      !/on\s*$/i.test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+(inner|left|right|full(?:\s+outer)?)\s+join\s+(\w+)(?:\s+(\w+))?\s*$/i
      );
      if (
        match &&
        tables[match[1].toLowerCase()] &&
        tables[match[4].toLowerCase()]
      ) {
        const options: CompletionOption[] = [
          {
            label: "ON",
            type: "keyword",
            apply: " ON ",
            detail: `Specify join condition${
              match[1].toLowerCase() === match[4].toLowerCase()
                ? " (self-join)"
                : ""
            }`,
          },
        ];
        options.push(...validateUnion(tablesInQuery));
        return { from: word?.from ?? cursorPos, options };
      }
    }

    // 44. After ON, suggest columns from both tables
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+(inner|left|right|full(?:\\s+outer)?)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s+on\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+(inner|left|right|full(?:\s+outer)?)\s+join\s+(\w+)(?:\s+(\w+))?\s+on\s*$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const secondTable = match[4].toLowerCase();
        if (tables[firstTable] && tables[secondTable]) {
          if (
            firstTable === secondTable &&
            (match[2]?.toLowerCase() || firstTable) ===
              (match[5]?.toLowerCase() || secondTable)
          ) {
            const options: CompletionOption[] = [
              {
                label: "",
                type: "text",
                apply: "",
                detail:
                  "Error: Self-join requires distinct aliases for the same table",
              },
            ];
            options.push(...validateUnion(tablesInQuery));
            return { from: word?.from ?? cursorPos, options };
          }
          const firstTableColumns = getColumnOptions(
            [],
            tables[firstTable]
          ).map((opt) => ({
            ...opt,
            detail: `${opt.detail}${
              firstTable === secondTable ? " (self-join)" : ""
            }`,
          }));
          const secondTableColumns = getColumnOptions(
            [],
            tables[secondTable]
          ).map((opt) => ({
            ...opt,
            detail: `${opt.detail}${
              firstTable === secondTable ? " (self-join)" : ""
            }`,
          }));
          const options: CompletionOption[] = [
            ...firstTableColumns,
            ...secondTableColumns,
          ];
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 45. After ON table1.column, suggest operators
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+(inner|left|right|full(?:\\s+outer)?)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s+on\\s+(\\w+)\\.(\\w+)\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\\s+(\w+))?\s+(inner|left|right|full(?:\s+outer)?)\s+join\s+(\w+)(?:\\s+(\w+))?\s+on\s+(\w+)\.(\w+)\s*$/i
      );
      if (match) {
        const tableOrAlias = match[6].toLowerCase();
        const columnName = match[7].toLowerCase();
        const targetTable = availableTables.find(
          ({ name, alias }) => tableOrAlias === name || tableOrAlias === alias
        );
        if (
          targetTable &&
          tables[targetTable.name]?.columns.some(
            (col) => col.name.toLowerCase() === columnName
          )
        ) {
          const options: CompletionOption[] = [
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
          ];
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 46. After ON table1.column =, suggest columns from the other table
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+(inner|left|right|full(?:\\s+outer)?)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s+on\\s+(\\w+)\\.(\\w+)\\s*=\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+(inner|left|right|full(?:\s+outer)?)\s+join\s+(\w+)(?:\s+(\w+))?\s+on\s+(\w+)\.(\w+)\s*=\s*$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const secondTable = match[4].toLowerCase();
        const leftTableOrAlias = match[6].toLowerCase();
        const leftColumn = match[7].toLowerCase();
        const leftTable = availableTables.find(
          ({ name, alias }) =>
            leftTableOrAlias === name || leftTableOrAlias === alias
        );
        if (
          leftTable &&
          tables[firstTable] &&
          tables[secondTable] &&
          tables[leftTable.name]?.columns.some(
            (col) => col.name.toLowerCase() === leftColumn
          )
        ) {
          const otherTable =
            firstTable === leftTable.name ? secondTable : firstTable;
          const options: CompletionOption[] = getColumnOptions(
            [],
            tables[otherTable],
            firstTable === leftTable.name
              ? match[5]?.toLowerCase() || secondTable
              : match[2]?.toLowerCase() || firstTable
          ).map((opt) => ({
            ...opt,
            detail: `${opt.detail}${
              firstTable === secondTable ? " (self-join)" : ""
            }`,
          }));
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 47. After ON table1.column = table2.column, suggest AND, WHERE, GROUP BY, ORDER BY, LIMIT, or UNION
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+(inner|left|right|full(?:\\s+outer)?)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s+on\\s+(\\w+)\\.(\\w+)\\s*=\\s*(\\w+)\\.(\\w+)\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+(inner|left|right|full(?:\s+outer)?)\s+join\s+(\w+)(?:\s+(\w+))?\s+on\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)\s*$/i
      );
      if (match) {
        const leftTableOrAlias = match[6].toLowerCase();
        const leftColumn = match[7].toLowerCase();
        const rightTableOrAlias = match[8].toLowerCase();
        const rightColumn = match[9].toLowerCase();
        const leftTable = availableTables.find(
          ({ name, alias }) =>
            leftTableOrAlias === name || leftTableOrAlias === alias
        );
        const rightTable = availableTables.find(
          ({ name, alias }) =>
            rightTableOrAlias === name || rightTableOrAlias === alias
        );
        if (
          leftTable &&
          rightTable &&
          tables[leftTable.name]?.columns.some(
            (col) => col.name.toLowerCase() === leftColumn
          ) &&
          tables[rightTable.name]?.columns.some(
            (col) => col.name.toLowerCase() === rightColumn
          )
        ) {
          const options: CompletionOption[] = [
            {
              label: "AND",
              type: "keyword",
              apply: " AND ",
              detail: "Add another join condition",
            },
            {
              label: "WHERE",
              type: "keyword",
              apply: " WHERE ",
              detail: "Filter rows",
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
            {
              label: "UNION",
              type: "keyword",
              apply: " UNION ",
              detail: "Combine with another SELECT query (removes duplicates)",
            },
            {
              label: "UNION ALL",
              type: "keyword",
              apply: " UNION ALL ",
              detail: "Combine with another SELECT query (keeps duplicates)",
            },
          ];
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 48. After ON table1.column = table2.column AND, suggest columns from both tables
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s+(inner|left|right|full(?:\\s+outer)?)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?\\s+on\\s+(\\w+)\\.(\\w+)\\s*=\\s*(\\w+)\\.(\\w+)\\s+and\\s*$`,
        "i"
      ).test(docText)
    ) {
      const match = docText.match(
        /from\s+(\w+)(?:\s+(\w+))?\s+(inner|left|right|full(?:\s+outer)?)\s+join\s+(\w+)(?:\s+(\w+))?\s+on\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)\s+and\s*$/i
      );
      if (match) {
        const firstTable = match[1].toLowerCase();
        const secondTable = match[4].toLowerCase();
        if (tables[firstTable] && tables[secondTable]) {
          if (
            firstTable === secondTable &&
            (match[2]?.toLowerCase() || firstTable) ===
              (match[5]?.toLowerCase() || secondTable)
          ) {
            const options: CompletionOption[] = [
              {
                label: "",
                type: "text",
                apply: "",
                detail:
                  "Error: Self-join requires distinct aliases for the same table",
              },
            ];
            options.push(...validateUnion(tablesInQuery));
            return { from: word?.from ?? cursorPos, options };
          }
          const firstTableColumns = getColumnOptions(
            [],
            tables[firstTable],
            match[2]?.toLowerCase() || firstTable
          ).map((opt) => ({
            ...opt,
            detail: `${opt.detail}${
              firstTable === secondTable ? " (self-join)" : ""
            }`,
          }));
          const secondTableColumns = getColumnOptions(
            [],
            tables[secondTable],
            match[5]?.toLowerCase() || secondTable
          ).map((opt) => ({
            ...opt,
            detail: `${opt.detail}${
              firstTable === secondTable ? " (self-join)" : ""
            }`,
          }));
          const options: CompletionOption[] = [
            ...firstTableColumns,
            ...secondTableColumns,
          ];
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 49. After WHERE (no conditions), suggest columns, EXISTS, and NOT EXISTS
    if (
      new RegExp(
        `from\\s+(\\w+)(?:\\s+(\\w+))?\\s*(?:(inner|left|right|full(?:\\s+outer)?|cross)\\s+join\\s+(\\w+)(?:\\s+(\\w+))?)*\\s+where\\s*$`,
        "i"
      ).test(docText)
    ) {
      const options: CompletionOption[] = [];
      availableTables.forEach(({ name, alias }) => {
        if (tables[name]) {
          options.push(...getColumnOptions([], tables[name], alias));
        }
      });
      options.push(
        {
          label: "EXISTS",
          type: "keyword",
          apply: "EXISTS (",
          detail: "Check for existence of rows in subquery",
          boost: 90,
        },
        {
          label: "NOT EXISTS",
          type: "keyword",
          apply: "NOT EXISTS (",
          detail: "Check for non-existence of rows in subquery",
          boost: 90,
        }
      );
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 50. After EXISTS or NOT EXISTS, suggest SELECT for subquery
    if (
      /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*$/i.test(
        docText
      )
    ) {
      const options: CompletionOption[] = getSubqueryOptions();
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 51. After EXISTS (SELECT or NOT EXISTS (SELECT, suggest columns or *
    if (
      /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s*$/i.test(
        docText
      )
    ) {
      const options: CompletionOption[] = [
        { label: "*", type: "field", apply: "* ", detail: "All columns" },
      ];
      options.push(...getSubqueryColumnOptions(tables, availableTables));
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 52. After EXISTS (SELECT * or NOT EXISTS (SELECT *, suggest FROM
    if (
      /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s*$/i.test(
        docText
      )
    ) {
      const options: CompletionOption[] = [
        {
          label: "FROM",
          type: "keyword",
          apply: "FROM ",
          detail: "Specify table in subquery",
        },
      ];
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 53. After EXISTS (SELECT * FROM or NOT EXISTS (SELECT * FROM, suggest table names
    if (
      /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s*$/i.test(
        docText
      )
    ) {
      const options: CompletionOption[] = Object.keys(tables).map(
        (tableName) => ({
          label: tableName,
          type: "table",
          apply: tableName + " ",
          detail: "Table name for subquery",
        })
      );
      options.push(...validateUnion(tablesInQuery));
      return { from: word?.from ?? cursorPos, options };
    }

    // 54. After EXISTS (SELECT * FROM table_name, suggest WHERE or )
    if (
      /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s*$/i.test(
        docText
      )
    ) {
      const match = docText.match(
        /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s*$/i
      );
      if (match && tables[match[1].toLowerCase()]) {
        const options: CompletionOption[] = [
          {
            label: "WHERE",
            type: "keyword",
            apply: "WHERE ",
            detail: "Filter rows in subquery",
          },
          {
            label: ")",
            type: "operator",
            apply: ") ",
            detail: "Close EXISTS subquery",
          },
        ];
        options.push(...validateUnion(tablesInQuery));
        return { from: word?.from ?? cursorPos, options };
      }
    }

    // 55. After EXISTS (SELECT * FROM table_name WHERE, suggest columns
    if (
      /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s+where\s*$/i.test(
        docText
      )
    ) {
      const match = docText.match(
        /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s+where\s*$/i
      );
      if (match && tables[match[1].toLowerCase()]) {
        const tableName = match[1].toLowerCase();
        const alias = match[2]?.toLowerCase();
        const options: CompletionOption[] = getColumnOptions(
          [],
          tables[tableName],
          alias || tableName
        );
        options.push(...validateUnion(tablesInQuery));
        return { from: word?.from ?? cursorPos, options };
      }
    }

    // 56. After EXISTS (SELECT * FROM table_name WHERE table.column, suggest operators
    if (
      /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s+where\s+(\w+)\.(\w+)\s*$/i.test(
        docText
      )
    ) {
      const match = docText.match(
        /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s+where\s+(\w+)\.(\w+)\s*$/i
      );
      if (match) {
        const tableName = match[1].toLowerCase();
        const alias = match[2]?.toLowerCase();
        const tableOrAlias = match[3].toLowerCase();
        const columnName = match[4].toLowerCase();
        if (
          tables[tableName] &&
          (tableOrAlias === tableName || tableOrAlias === alias) &&
          tables[tableName].columns.some(
            (col) => col.name.toLowerCase() === columnName
          )
        ) {
          const options: CompletionOption[] = [
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
          ];
          options.push(...validateUnion(tablesInQuery));
          return { from: word?.from ?? cursorPos, options };
        }
      }
    }

    // 57. After EXISTS (SELECT * FROM table_name WHERE table.column operator, suggest values
    if (
      /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s+where\s+(\w+)\.(\w+)\s*(=|!=|>|<|>=|<=|LIKE|BETWEEN)\s*(?:('[^']*'|[^' ]\w*)?)?$/i.test(
        docText
      )
    ) {
      const match = docText.match(
        /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s+where\s+(\w+)\.(\w+)\s*(=|!=|>|<|>=|<=|LIKE|BETWEEN)\s*(?:('[^']*'|[^' ]\w*)?)?$/i
      );
      if (match) {
        const tableName = match[1].toLowerCase();
        const alias = match[2]?.toLowerCase();
        const tableOrAlias = match[3].toLowerCase();
        const column = match[4];
        const operator = match[5];
        const value1 = match[6];
        if (
          tables[tableName] &&
          (tableOrAlias === tableName || tableOrAlias === alias) &&
          tables[tableName].columns.some(
            (col) => col.name.toLowerCase() === column.toLowerCase()
          )
        ) {
          const columnDef = tables[tableName].columns.find(
            (col) => col.name.toLowerCase() === column.toLowerCase()
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
              const options: CompletionOption[] = sampleValues.map((value) => ({
                label: value,
                type: "value",
                apply: value + (value1 ? "" : " AND "),
                detail: value1
                  ? "Second value for BETWEEN"
                  : "First value for BETWEEN",
              }));
              options.push(...validateUnion(tablesInQuery));
              return { from: word?.from ?? cursorPos, options };
            }

            if (operator.toUpperCase() === "LIKE") {
              const likePatterns = getLikePatternSuggestions(
                tables[tableName],
                column as keyof PowerRanger
              );
              const options: CompletionOption[] = likePatterns.map(
                (pattern) => ({
                  label: pattern,
                  type: "value",
                  apply: pattern,
                  detail: "LIKE pattern",
                })
              );
              options.push(...validateUnion(tablesInQuery));
              return { from: word?.from ?? cursorPos, options };
            }

            if (["IS NULL", "IS NOT NULL"].includes(operator.toUpperCase())) {
              const options: CompletionOption[] = [
                {
                  label: ")",
                  type: "operator",
                  apply: ") ",
                  detail: "Close EXISTS subquery",
                },
              ];
              options.push(...validateUnion(tablesInQuery));
              return { from: word?.from ?? cursorPos, options };
            }

            const sampleValues = getUniqueValues(
              column as keyof PowerRanger,
              columnType,
              tables[tableName]
            );
            const options: CompletionOption[] = sampleValues.map((value) => ({
              label: value,
              type: "value",
              apply: value + " ",
              detail: "Value",
            }));
            options.push(...validateUnion(tablesInQuery));
            return { from: word?.from ?? cursorPos, options };
          }
        }
      }
    }

    // 58. After EXISTS (SELECT * FROM table_name WHERE condition, suggest AND, OR, or )
    if (
      /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s+where\s+.*?(?:\\w+\\.\\w+\\s*(=|\\!=|>|<|>=|<=|LIKE)\\s*('[^']*'|[^' ]\\w*)|\\w+\\.\\w+\\s*BETWEEN\\s*('[^']*'|[^' ]\\w*)\\s*AND\\s*('[^']*'|[^' ]\\w*)|\\w+\\.\\w+\\s*(IS NULL|IS NOT NULL))\\s*$/i.test(
        docText
      )
    ) {
      const match = docText.match(
        /from\s+\w+(?:\s+\w+)?\s*(?:(?:inner|left|right|full(?:\s+outer)?|cross)\s+join\s+\w+(?:\s+\w+)?)?\s+where\s+.*?(?:not\s+)?exists\s*\(\s*select\s+\*\s+from\s+(\w+)(?:\s+(\w+))?\s+where\s+.*?(?:\\w+\\.\\w+\\s*(=|\\!=|>|<|>=|<=|LIKE)\s*('[^']*'|[^' ]\\w*)|\w+\\.\\w+\s*BETWEEN\s*('[^']*'|[^' ]\\w*)\s*AND\s*('[^']*'|[^' ]\\w*)|\w+\\.\\w+\s*(IS NULL|IS NOT NULL))\s*$/i
      );
      if (match && tables[match[1].toLowerCase()]) {
        const options: CompletionOption[] = [
          {
            label: "AND",
            type: "keyword",
            apply: " AND ",
            detail: "Combine with another condition in subquery",
          },
          {
            label: "OR",
            type: "keyword",
            apply: " OR ",
            detail: "Combine with another condition in subquery",
          },
          {
            label: ")",
            type: "operator",
            apply: ") ",
            detail: "Close EXISTS subquery",
          },
        ];
        options.push(...validateUnion(tablesInQuery));
        return { from: word?.from ?? cursorPos, options };
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
