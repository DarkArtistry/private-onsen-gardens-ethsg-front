import { LocalMerkleTree } from "./localStorage";

export class MerkleTree {
  constructor(n_levels = 20, prefix, hasher, storage = new LocalMerkleTree()) {
    this.n_levels = n_levels;
    this.prefix = prefix;
    this.hasher = hasher;
    this.storage = storage;
    this.zero_values = [];
    this.totalElements = 0;

    let current_zero_value =
      "21663839004416932945382355908790599225266501822907911457504978515578255421292";
    this.zero_values.push(current_zero_value);
    for (let i = 0; i < n_levels; i++) {
      current_zero_value = this.hasher.hash(
        current_zero_value,
        current_zero_value
      );
      this.zero_values.push(current_zero_value.toString());
    }
  }

  static index_to_key(prefix, level, index) {
    const key = `${prefix}_tree_${level}_${index}`;
    return key;
  }

  async root() {
    let root = await this.storage.getMerkleTreeOrDefault(
      MerkleTree.index_to_key(this.prefix, this.n_levels, 0),
      this.zero_values[this.n_levels]
    );

    return root;
  }

  async path(index) {
    class PathTraverser {
      constructor(prefix, storage, zero_values) {
        this.prefix = prefix;
        this.storage = storage;
        this.zero_values = zero_values;
        this.path_elements = [];
        this.path_index = [];
      }

      async handle_index(level, element_index, sibling_index) {
        console.log("bye hi");
        const sibling = await this.storage.getMerkleTreeOrDefault(
          MerkleTree.index_to_key(this.prefix, level, sibling_index),
          this.zero_values[level]
        );
        this.path_elements.push(sibling);
        this.path_index.push(element_index % 2);
      }
    }
    index = Number(index);
    let traverser = new PathTraverser(
      this.prefix,
      this.storage,
      this.zero_values
    );
    const root = await this.storage.getMerkleTreeOrDefault(
      MerkleTree.index_to_key(this.prefix, this.n_levels, 0),
      this.zero_values[this.n_levels]
    );

    const element = await this.storage.getMerkleTreeOrDefault(
      MerkleTree.index_to_key(this.prefix, 0, index),
      this.zero_values[0]
    );

    await this.traverse(index, traverser);
    return {
      root,
      path_elements: traverser.path_elements,
      path_index: traverser.path_index,
      element,
    };
  }

  async update(index, element, insert = false) {
    if (!insert && index >= this.totalElements) {
      throw Error("Use insert method for new elements.");
    } else if (insert && index < this.totalElements) {
      throw Error("Use update method for existing elements.");
    }
    try {
      class UpdateTraverser {
        original_element = "";
        constructor(prefix, storage, hasher, current_element, zero_values) {
          this.prefix = prefix;
          this.storage = storage;
          this.hasher = hasher;
          this.current_element = current_element;
          this.zero_values = zero_values;
          this.key_values_to_put = [];
        }

        async handle_index(level, element_index, sibling_index) {
          console.log("test hi");
          if (level == 0) {
            this.original_element = await this.storage.getMerkleTreeOrDefault(
              MerkleTree.index_to_key(this.prefix, level, element_index),
              this.zero_values[level]
            );
          }
          const sibling = await this.storage.getMerkleTreeOrDefault(
            MerkleTree.index_to_key(this.prefix, level, sibling_index),
            this.zero_values[level]
          );
          let left, right;
          if (element_index % 2 == 0) {
            left = this.current_element;
            right = sibling;
          } else {
            left = sibling;
            right = this.current_element;
          }

          this.key_values_to_put.push({
            key: MerkleTree.index_to_key(this.prefix, level, element_index),
            value: this.current_element,
          });
          this.current_element = this.hasher.hash(left, right);
        }
      }
      let traverser = new UpdateTraverser(
        this.prefix,
        this.storage,
        this.hasher,
        element,
        this.zero_values
      );

      await this.traverse(index, traverser);
      traverser.key_values_to_put.push({
        key: MerkleTree.index_to_key(this.prefix, this.n_levels, 0),
        value: traverser.current_element,
      });

      await this.storage.setBatch(traverser.key_values_to_put);
    } catch (e) {
      console.error(e);
    }
  }

  // element is commitmentHash
  async insert(element) {
    const index = this.totalElements;
    await this.update(index, element, true);
    this.totalElements++;
  }

  async traverse(index, handler) {
    console.log("hi");
    let current_index = index;
    for (let i = 0; i < this.n_levels; i++) {
      let sibling_index = current_index;
      if (current_index % 2 == 0) {
        sibling_index += 1;
      } else {
        sibling_index -= 1;
      }
      await handler.handle_index(i, current_index, sibling_index);
      current_index = Math.floor(current_index / 2);
    }
  }

  getIndexByElement(element) {
    for (let i = this.totalElements - 1; i >= 0; i--) {
      const elementFromTree = this.storage.get(
        MerkleTree.index_to_key(this.prefix, 0, i)
      );
      if (elementFromTree === element) {
        return i;
      }
    }
    return false;
  }
}
