interface IStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

abstract class GenericStorage<T extends string> {
    private readonly storage: IStorage;

    public constructor(getStorage = (): IStorage => window.localStorage) {
      this.storage = getStorage();
    }
  
    protected get(key: T): string | null {
      return this.storage.getItem(key);
    }
  
    protected set(key: T, value: string): void {
      this.storage.setItem(key, value);
    }
  
    protected clearItem(key: T): void {
      this.storage.removeItem(key);
    }
  
    protected clearItems(keys: T[]): void {
      keys.forEach((key) => this.clearItem(key));
    }
}

export class LocalMerkleTree extends GenericStorage<string> {
    constructor() {
        super();
    }

    public get(key: string) {
        return this.get(key)
    }

    public getMerkleTreeOrDefault(key: string, defaultEl: string) {
        const el = this.get(key);
        if (el === null) {
            return defaultEl;
        } else {
            return el;
        } 
    }
    
    public setMerkleTree(key: string, value: string) {
        this.set(key, value);
    }

    public clear(key: string) {
        this.clearItems([key]);
    }

    public setBatch(key_values: { key: string; value: string }[]) {
        key_values.forEach((el) => {
            this.set(el.key, el.value);
        });
    }
}
