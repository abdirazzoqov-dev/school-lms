/**
 * Shared answer sheet layout constants.
 * Used by:
 *  - answer-sheet-print-client.tsx  (HTML generation in mm)
 *  - omr-scan-client.tsx            (bubble detection in px)
 *
 * All base values are in mm. Use pxOf(mm) for pixel conversion.
 * Canvas is normalized to A4 at 96dpi: 794 × 1123 px = 210 × 297 mm
 */

export const PX_PER_MM = 794 / 210          // ≈ 3.781 px/mm

export function pxOf(mm: number) {
  return mm * PX_PER_MM
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export const PAGE_W_MM = 210
export const PAGE_H_MM = 297
export const MARGIN_MM = 5                   // all 4 sides

// ─── Header block ─────────────────────────────────────────────────────────────
// Row 1: "JAVOBLAR VARAQASI" + QR code
// Row 2: F.I.O | Sinf | Sana | Variant
export const HEADER_H_MM = 25               // combined height of title + student row

// ─── Instructions bar ─────────────────────────────────────────────────────────
export const INSTR_H_MM = 4

// ─── Subject block ────────────────────────────────────────────────────────────
export const SUB_HEADER_H_MM = 5.5          // coloured header bar
export const SUB_PAD_V_MM    = 1            // vertical padding inside question area
export const ROW_H_MM        = 7            // height of one question row
export const MAX_ROWS        = 6            // rows per column (30 ÷ 5 cols = 6)
export const NUM_COLS        = 5            // question columns per subject

// Derived subject block height: header + padV*2 + maxRows*rowH
export const SUB_H_MM = SUB_HEADER_H_MM + SUB_PAD_V_MM * 2 + MAX_ROWS * ROW_H_MM
// = 5.5 + 2 + 42 = 49.5 mm

// ─── Column / Bubble ──────────────────────────────────────────────────────────
export const USABLE_W_MM   = PAGE_W_MM - MARGIN_MM * 2   // 200 mm
export const COL_W_MM      = USABLE_W_MM / NUM_COLS       // 40 mm

export const Q_NUM_W_MM    = 7.5             // question-number label width
export const BUBBLE_D_MM   = 5              // bubble diameter
export const BUBBLE_GAP_MM = 0.9            // gap between bubbles
export const NUM_OPTIONS   = 4              // A B C D

// Bubble i centre X from column-left edge:
//   qNumW + i*(bubbleD + bubbleGap) + bubbleD/2
export function bubbleColOffsetMM(i: number) {
  return Q_NUM_W_MM + i * (BUBBLE_D_MM + BUBBLE_GAP_MM) + BUBBLE_D_MM / 2
}

// ─── Footer ───────────────────────────────────────────────────────────────────
export const FOOTER_H_MM = 3

// ─── Compute absolute Y of a subject's question-grid top (in mm) ──────────────
export function subjectGridTopMM(subIdx: number) {
  const subjBlockTop = MARGIN_MM + HEADER_H_MM + INSTR_H_MM + subIdx * SUB_H_MM
  return subjBlockTop + SUB_HEADER_H_MM + SUB_PAD_V_MM
}

// ─── Compute absolute X of column left edge (in mm) ──────────────────────────
export function colLeftMM(colIdx: number) {
  return MARGIN_MM + colIdx * COL_W_MM
}

// ─── Get bubble centre (mm) for a specific answer ────────────────────────────
// subIdx: 0-based subject index in this exam
// qNum:   1-based question number within subject
// optIdx: 0-based option index (0=A,1=B,2=C,3=D)
export function bubbleCentreMM(
  subIdx: number,
  qNum: number,
  optIdx: number,
  questionCount: number
) {
  const rowsPerCol = Math.ceil(questionCount / NUM_COLS)
  const colIdx = Math.floor((qNum - 1) / rowsPerCol)
  const rowIdx = (qNum - 1) % rowsPerCol

  const gridTopMM = subjectGridTopMM(subIdx)
  const y = gridTopMM + rowIdx * ROW_H_MM + ROW_H_MM / 2

  const colLeft = colLeftMM(colIdx)
  const x = colLeft + bubbleColOffsetMM(optIdx)

  return { x, y }
}

// Same but in pixels
export function bubbleCentrePX(
  subIdx: number,
  qNum: number,
  optIdx: number,
  questionCount: number
) {
  const { x, y } = bubbleCentreMM(subIdx, qNum, optIdx, questionCount)
  return { x: pxOf(x), y: pxOf(y) }
}
