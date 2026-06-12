// ===============================================
// AlariHash‑X: Overengineered Encoding Pipeline
// Prefix: alaricholt677.encoded$
// ===============================================

// High-level API
const alariEncode = (input) => {
  // Stage 1: Normalize input
  const normalized = normalizeInput(input);

  // Stage 2: Text → binary
  const binary = textToBinary(normalized);

  // Stage 3: Multi-round binary scrambling
  const scrambled = multiRoundScramble(binary, 5);

  // Stage 4: Chunk + mix into blocks
  const blocks = chunkAndMix(scrambled, 64);

  // Stage 5: Fold blocks into rolling state
  const state = foldBlocks(blocks);

  // Stage 6: Final avalanche mixing
  const finalInt = avalancheMix(state);

  // Stage 7: Hex formatting
  const hex = intToHex(finalInt, 16);

  // Stage 8: Prefix + return
  return `alaricholt677.encoded$${hex}`;
};

// ===============================================
// Stage 1: Normalize input
// ===============================================

function normalizeInput(str) {
  // Lowercase + trim + collapse spaces
  // (Python: s = ' '.join(s.lower().split()))
  return str
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// ===============================================
// Stage 2: Text → binary
// ===============================================

function textToBinary(str) {
  // Python:
  //   binary = ''.join(format(ord(c), '08b') for c in s)
  return Array.from(str)
    .map(ch => ch.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

// ===============================================
// Stage 3: Multi-round binary scrambling
// ===============================================

function multiRoundScramble(binary, rounds) {
  let current = binary;
  for (let r = 0; r < rounds; r++) {
    current = scrambleOnce(current, r);
  }
  return current;
}

function scrambleOnce(binary, roundIndex) {
  let out = "";
  const shift = (7 + roundIndex * 3) % binary.length || 1;

  for (let i = 0; i < binary.length; i++) {
    const a = binary[i];
    const b = binary[(i + shift) % binary.length];
    const c = binary[(i + binary.length - shift) % binary.length];

    // XOR three bits together
    const bit = (a ^ b ^ c) & 1;
    out += bit;
  }

  return out;
}

// ===============================================
// Stage 4: Chunk + mix into blocks
// ===============================================

function chunkAndMix(binary, blockSize) {
  const blocks = [];
  for (let i = 0; i < binary.length; i += blockSize) {
    const chunk = binary.slice(i, i + blockSize);
    blocks.push(mixChunk(chunk));
  }
  return blocks;
}

function mixChunk(chunk) {
  // Turn chunk into 32-bit int with some mixing
  let acc = 0;
  for (let i = 0; i < chunk.length; i++) {
    const bit = chunk[i] === "1" ? 1 : 0;
    acc ^= (bit << (i % 31));
    acc = rotateLeft(acc, (i % 5) + 1);
    acc |= 0;
  }
  return acc >>> 0;
}

// ===============================================
// Stage 5: Fold blocks into rolling state
// ===============================================

function foldBlocks(blocks) {
  let state = 0x9e3779b9; // golden ratio constant

  for (let i = 0; i < blocks.length; i++) {
    let v = blocks[i];

    // Mix block into state
    state ^= v;
    state = (state + ((v << 5) - (v >>> 3))) | 0;
    state = rotateLeft(state, (i % 13) + 3);
    state ^= (state >>> 11);
    state |= 0;
  }

  return state >>> 0;
}

// ===============================================
// Stage 6: Final avalanche mixing
// ===============================================

function avalancheMix(x) {
  // Classic avalanche-style bit mixing
  x ^= x >>> 15;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return x >>> 0;
}

// ===============================================
// Stage 7: Int → hex
// ===============================================

function intToHex(x, length) {
  return x.toString(16).padStart(length, "0");
}

// ===============================================
// Helpers
// ===============================================

function rotateLeft(x, n) {
  return ((x << n) | (x >>> (32 - n))) >>> 0;
}

// ===============================================
// Example usage
// ===============================================

// console.log(alariEncode("hello"));
// console.log(alariEncode("BlockVerse"));
// console.log(alariEncode("password123"));
// console.log(alariEncode("ALARICHOLT 677"));

// ===============================================
// Python sketch (comment-only, not executable here)
// ===============================================
//
// def normalize_input(s: str) -> str:
//     return ' '.join(s.lower().split())
//
// def text_to_binary(s: str) -> str:
//     return ''.join(format(ord(c), '08b') for c in s)
//
// def scramble_once(binary: str, round_index: int) -> str:
//     out = []
//     shift = (7 + round_index * 3) % len(binary) or 1
//     for i in range(len(binary)):
//         a = int(binary[i])
//         b = int(binary[(i + shift) % len(binary)])
//         c = int(binary[(i + len(binary) - shift) % len(binary)])
//         bit = (a ^ b ^ c) & 1
//         out.append(str(bit))
//     return ''.join(out)
//
// def multi_round_scramble(binary: str, rounds: int) -> str:
//     current = binary
//     for r in range(rounds):
//         current = scramble_once(current, r)
//     return current
//
// def mix_chunk(chunk: str) -> int:
//     acc = 0
//     for i, ch in enumerate(chunk):
//         bit = 1 if ch == '1' else 0
//         acc ^= (bit << (i % 31))
//         acc = ((acc << ((i % 5) + 1)) | (acc >> (32 - ((i % 5) + 1)))) & 0xffffffff
//     return acc & 0xffffffff
//
// def chunk_and_mix(binary: str, block_size: int) -> list[int]:
//     blocks = []
//     for i in range(0, len(binary), block_size):
//         chunk = binary[i:i+block_size]
//         blocks.append(mix_chunk(chunk))
//     return blocks
//
// def fold_blocks(blocks: list[int]) -> int:
//     state = 0x9e3779b9
//     for i, v in enumerate(blocks):
//         state ^= v
//         state = (state + ((v << 5) - (v >> 3))) & 0xffffffff
//         rot = (i % 13) + 3
//         state = ((state << rot) | (state >> (32 - rot))) & 0xffffffff
//         state ^= (state >> 11)
//     return state & 0xffffffff
//
// def avalanche_mix(x: int) -> int:
//     x ^= x >> 15
//     x = (x * 0x85ebca6b) & 0xffffffff
//     x ^= x >> 13
//     x = (x * 0xc2b2ae35) & 0xffffffff
//     x ^= x >> 16
//     return x & 0xffffffff
//
// def alari_encode_py(s: str) -> str:
//     s = normalize_input(s)
//     b = text_to_binary(s)
//     scr = multi_round_scramble(b, 5)
//     blocks = chunk_and_mix(scr, 64)
//     state = fold_blocks(blocks)
//     final_int = avalanche_mix(state)
//     hex_value = format(final_int, '016x')
//     return f"alaricholt677.encoded${hex_value}"
