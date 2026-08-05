export type AutoAssignableEquipmentUnit = {
  serialNo: string;
  notes: string;
};

function noteSequence(notes: string) {
  const match = notes.match(/\bno\.?\s*(\d+)\b/i);
  return match ? Number(match[1]) : null;
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
