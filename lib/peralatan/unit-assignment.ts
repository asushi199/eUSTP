export type AutoAssignableEquipmentUnit = {
  serialNo: string;
  notes: string;
};

export type EquipmentUnitOption = AutoAssignableEquipmentUnit & {
  model: string;
  typeName: string;
};

function noteSequence(notes: string) {
  const match = notes.match(/^\s*(?:no|nombor)\.?\s*(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

export function equipmentUnitNoteLabel(notes: string) {
  const sequence = noteSequence(notes);
  return sequence === null ? "" : `No ${sequence}`;
}

function shortModelLabel(model: string) {
  const words = model.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];

  const modelCode = [...words.slice(1)].reverse().find((word) => /\d/.test(word));
  const shortCode = modelCode?.split("-")[0] ?? "";
  if (shortCode.length > 2) return `${words[0]} ${shortCode}`;

  return [words[0], ...words.slice(1, 3)].join(" ");
}

export function equipmentUnitOptionLabel(unit: EquipmentUnitOption) {
  return [
    equipmentUnitNoteLabel(unit.notes),
    shortModelLabel(unit.model || unit.typeName),
    unit.serialNo,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Sorts by the pre-assigned sequence in Catatan, then by serial number. */
export function sortUnitsForAutoAllocation<T extends AutoAssignableEquipmentUnit>(
  units: T[],
) {
  return [...units].sort((left, right) => {
    const leftSequence = noteSequence(left.notes);
    const rightSequence = noteSequence(right.notes);

    if (leftSequence !== null && rightSequence !== null) {
      if (leftSequence !== rightSequence) return leftSequence - rightSequence;
    } else if (leftSequence !== null) {
      return -1;
    } else if (rightSequence !== null) {
      return 1;
    }

    return left.serialNo.localeCompare(right.serialNo, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
}
