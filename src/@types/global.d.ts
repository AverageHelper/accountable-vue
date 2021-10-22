/**
 * A Record that behaves like a JavaScript Object in that a given key may have no associated value.
 */
type Dictionary<T> = Record<string, T>;

/**
 * Replaces the type of the given key of an interface with a different type.
 *
 * For example:
 * ```
 * interface File {
 *   name: string;
 *   size: number;
 * }
 *
 * const different: ReplaceWith<File, "size", string> = {
 *   name: "Foo",
 *   size: "Bar" // The type here is now `string`, not `number`, so this is valid
 * };
 * ```
 */
type ReplaceWith<T, K extends keyof T, U> = Omit<T, K> & Record<K, U>;
