import { MerkleTree, Hasher } from "./merkleTree";
import { BigNumber } from "@ethersproject/bignumber";
import { isHexString } from "@ethersproject/bytes";

function hexZeroPad(value, length) {
    if (typeof value !== "string") {
      value = hexlify(value)
    } else if (!isHexString(value)) {
      logger.throwArgumentError("invalid hex string", "value", value)
    }
  
    if (value.length > 2 * length + 2) {
      logger.throwArgumentError("value out of range", "value", arguments[1])
    }
  
    while (value.length < 2 * length + 2) {
      value = "0x0" + value.substring(2)
    }
  
    return value
  }

export function poseidonHash(poseidon, inputs) {
    const hash = poseidon(inputs.map(x => BigNumber.from(x).toBigInt()));
    // Make the number within the field size
    const hashStr = poseidon.F.toString(hash);
    // Make it a valid hex string
    const hashHex = BigNumber.from(hashStr).toHexString();
    // pad zero to make it 32 bytes, so that the output can be taken as a bytes32 contract argument
    const bytes32 = hexZeroPad(hashHex, 32);
    return bytes32;
}

// class PoseidonHasher extends Hasher {
//     constructor(poseidon) {
//         this.poseidon = poseidon;
//     }

//     hash(left, right) {
//         return poseidonHash(this.poseidon, [left, right]);
//     }
// }
