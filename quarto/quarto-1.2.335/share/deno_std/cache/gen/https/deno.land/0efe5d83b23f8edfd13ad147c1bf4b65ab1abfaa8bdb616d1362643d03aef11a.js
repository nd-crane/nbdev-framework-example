// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
/** This module is browser compatible. */ import { ascend, BinarySearchTree } from "./binary_search_tree.ts";
import { RedBlackNode } from "./red_black_node.ts";
export * from "./_comparators.ts";
/**
 * A red-black tree. This is a kind of self-balancing binary search tree.
 * The values are in ascending order by default,
 * using JavaScript's built in comparison operators to sort the values.
 */ export class RedBlackTree extends BinarySearchTree {
    constructor(compare = ascend){
        super(compare);
    }
    static from(collection, options) {
        let result;
        let unmappedValues = [];
        if (collection instanceof RedBlackTree) {
            result = new RedBlackTree(options?.compare ?? collection.compare);
            if (options?.compare || options?.map) {
                unmappedValues = collection;
            } else {
                const nodes = [];
                if (collection.root) {
                    result.root = RedBlackNode.from(collection.root);
                    nodes.push(result.root);
                }
                while(nodes.length){
                    const node = nodes.pop();
                    const left = node.left ? RedBlackNode.from(node.left) : null;
                    const right = node.right ? RedBlackNode.from(node.right) : null;
                    if (left) {
                        left.parent = node;
                        nodes.push(left);
                    }
                    if (right) {
                        right.parent = node;
                        nodes.push(right);
                    }
                }
            }
        } else {
            result = options?.compare ? new RedBlackTree(options.compare) : new RedBlackTree();
            unmappedValues = collection;
        }
        const values = options?.map ? Array.from(unmappedValues, options.map, options.thisArg) : unmappedValues;
        for (const value of values)result.insert(value);
        return result;
    }
    removeFixup(parent, current) {
        while(parent && !current?.red){
            const direction = parent.left === current ? "left" : "right";
            const siblingDirection = direction === "right" ? "left" : "right";
            let sibling = parent[siblingDirection];
            if (sibling?.red) {
                sibling.red = false;
                parent.red = true;
                this.rotateNode(parent, direction);
                sibling = parent[siblingDirection];
            }
            if (sibling) {
                if (!sibling.left?.red && !sibling.right?.red) {
                    sibling.red = true;
                    current = parent;
                    parent = current.parent;
                } else {
                    if (!sibling[siblingDirection]?.red) {
                        sibling[direction].red = false;
                        sibling.red = true;
                        this.rotateNode(sibling, siblingDirection);
                        sibling = parent[siblingDirection];
                    }
                    sibling.red = parent.red;
                    parent.red = false;
                    sibling[siblingDirection].red = false;
                    this.rotateNode(parent, direction);
                    current = this.root;
                    parent = null;
                }
            }
        }
        if (current) current.red = false;
    }
    /**
   * Adds the value to the binary search tree if it does not already exist in it.
   * Returns true if successful.
   */ insert(value) {
        let node = this.insertNode(RedBlackNode, value);
        if (node) {
            while(node.parent?.red){
                let parent = node.parent;
                const parentDirection = parent.directionFromParent();
                const uncleDirection = parentDirection === "right" ? "left" : "right";
                const uncle = parent.parent[uncleDirection] ?? null;
                if (uncle?.red) {
                    parent.red = false;
                    uncle.red = false;
                    parent.parent.red = true;
                    node = parent.parent;
                } else {
                    if (node === parent[uncleDirection]) {
                        node = parent;
                        this.rotateNode(node, parentDirection);
                        parent = node.parent;
                    }
                    parent.red = false;
                    parent.parent.red = true;
                    this.rotateNode(parent.parent, uncleDirection);
                }
            }
            this.root.red = false;
        }
        return !!node;
    }
    /**
   * Removes node value from the binary search tree if found.
   * Returns true if found and removed.
   */ remove(value) {
        const node = this.removeNode(value);
        if (node && !node.red) {
            this.removeFixup(node.parent, node.left ?? node.right);
        }
        return !!node;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjE1My4wL2NvbGxlY3Rpb25zL3JlZF9ibGFja190cmVlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjIgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vKiogVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLiAqL1xuXG5pbXBvcnQgeyBhc2NlbmQsIEJpbmFyeVNlYXJjaFRyZWUgfSBmcm9tIFwiLi9iaW5hcnlfc2VhcmNoX3RyZWUudHNcIjtcbmltcG9ydCB7IERpcmVjdGlvbiwgUmVkQmxhY2tOb2RlIH0gZnJvbSBcIi4vcmVkX2JsYWNrX25vZGUudHNcIjtcbmV4cG9ydCAqIGZyb20gXCIuL19jb21wYXJhdG9ycy50c1wiO1xuXG4vKipcbiAqIEEgcmVkLWJsYWNrIHRyZWUuIFRoaXMgaXMgYSBraW5kIG9mIHNlbGYtYmFsYW5jaW5nIGJpbmFyeSBzZWFyY2ggdHJlZS5cbiAqIFRoZSB2YWx1ZXMgYXJlIGluIGFzY2VuZGluZyBvcmRlciBieSBkZWZhdWx0LFxuICogdXNpbmcgSmF2YVNjcmlwdCdzIGJ1aWx0IGluIGNvbXBhcmlzb24gb3BlcmF0b3JzIHRvIHNvcnQgdGhlIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlZEJsYWNrVHJlZTxUPiBleHRlbmRzIEJpbmFyeVNlYXJjaFRyZWU8VD4ge1xuICBkZWNsYXJlIHByb3RlY3RlZCByb290OiBSZWRCbGFja05vZGU8VD4gfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbXBhcmU6IChhOiBULCBiOiBUKSA9PiBudW1iZXIgPSBhc2NlbmQsXG4gICkge1xuICAgIHN1cGVyKGNvbXBhcmUpO1xuICB9XG5cbiAgLyoqIENyZWF0ZXMgYSBuZXcgcmVkLWJsYWNrIHRyZWUgZnJvbSBhbiBhcnJheSBsaWtlIG9yIGl0ZXJhYmxlIG9iamVjdC4gKi9cbiAgc3RhdGljIG92ZXJyaWRlIGZyb208VD4oXG4gICAgY29sbGVjdGlvbjogQXJyYXlMaWtlPFQ+IHwgSXRlcmFibGU8VD4gfCBSZWRCbGFja1RyZWU8VD4sXG4gICk6IFJlZEJsYWNrVHJlZTxUPjtcbiAgc3RhdGljIG92ZXJyaWRlIGZyb208VD4oXG4gICAgY29sbGVjdGlvbjogQXJyYXlMaWtlPFQ+IHwgSXRlcmFibGU8VD4gfCBSZWRCbGFja1RyZWU8VD4sXG4gICAgb3B0aW9uczoge1xuICAgICAgTm9kZT86IHR5cGVvZiBSZWRCbGFja05vZGU7XG4gICAgICBjb21wYXJlPzogKGE6IFQsIGI6IFQpID0+IG51bWJlcjtcbiAgICB9LFxuICApOiBSZWRCbGFja1RyZWU8VD47XG4gIHN0YXRpYyBvdmVycmlkZSBmcm9tPFQsIFUsIFY+KFxuICAgIGNvbGxlY3Rpb246IEFycmF5TGlrZTxUPiB8IEl0ZXJhYmxlPFQ+IHwgUmVkQmxhY2tUcmVlPFQ+LFxuICAgIG9wdGlvbnM6IHtcbiAgICAgIGNvbXBhcmU/OiAoYTogVSwgYjogVSkgPT4gbnVtYmVyO1xuICAgICAgbWFwOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIpID0+IFU7XG4gICAgICB0aGlzQXJnPzogVjtcbiAgICB9LFxuICApOiBSZWRCbGFja1RyZWU8VT47XG4gIHN0YXRpYyBvdmVycmlkZSBmcm9tPFQsIFUsIFY+KFxuICAgIGNvbGxlY3Rpb246IEFycmF5TGlrZTxUPiB8IEl0ZXJhYmxlPFQ+IHwgUmVkQmxhY2tUcmVlPFQ+LFxuICAgIG9wdGlvbnM/OiB7XG4gICAgICBjb21wYXJlPzogKGE6IFUsIGI6IFUpID0+IG51bWJlcjtcbiAgICAgIG1hcD86ICh2YWx1ZTogVCwgaW5kZXg6IG51bWJlcikgPT4gVTtcbiAgICAgIHRoaXNBcmc/OiBWO1xuICAgIH0sXG4gICk6IFJlZEJsYWNrVHJlZTxVPiB7XG4gICAgbGV0IHJlc3VsdDogUmVkQmxhY2tUcmVlPFU+O1xuICAgIGxldCB1bm1hcHBlZFZhbHVlczogQXJyYXlMaWtlPFQ+IHwgSXRlcmFibGU8VD4gPSBbXTtcbiAgICBpZiAoY29sbGVjdGlvbiBpbnN0YW5jZW9mIFJlZEJsYWNrVHJlZSkge1xuICAgICAgcmVzdWx0ID0gbmV3IFJlZEJsYWNrVHJlZShcbiAgICAgICAgb3B0aW9ucz8uY29tcGFyZSA/PyAoY29sbGVjdGlvbiBhcyB1bmtub3duIGFzIFJlZEJsYWNrVHJlZTxVPikuY29tcGFyZSxcbiAgICAgICk7XG4gICAgICBpZiAob3B0aW9ucz8uY29tcGFyZSB8fCBvcHRpb25zPy5tYXApIHtcbiAgICAgICAgdW5tYXBwZWRWYWx1ZXMgPSBjb2xsZWN0aW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgbm9kZXM6IFJlZEJsYWNrTm9kZTxVPltdID0gW107XG4gICAgICAgIGlmIChjb2xsZWN0aW9uLnJvb3QpIHtcbiAgICAgICAgICByZXN1bHQucm9vdCA9IFJlZEJsYWNrTm9kZS5mcm9tKFxuICAgICAgICAgICAgY29sbGVjdGlvbi5yb290IGFzIHVua25vd24gYXMgUmVkQmxhY2tOb2RlPFU+LFxuICAgICAgICAgICk7XG4gICAgICAgICAgbm9kZXMucHVzaChyZXN1bHQucm9vdCk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKG5vZGVzLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IG5vZGU6IFJlZEJsYWNrTm9kZTxVPiA9IG5vZGVzLnBvcCgpITtcbiAgICAgICAgICBjb25zdCBsZWZ0OiBSZWRCbGFja05vZGU8VT4gfCBudWxsID0gbm9kZS5sZWZ0XG4gICAgICAgICAgICA/IFJlZEJsYWNrTm9kZS5mcm9tKG5vZGUubGVmdClcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICAgICAgICBjb25zdCByaWdodDogUmVkQmxhY2tOb2RlPFU+IHwgbnVsbCA9IG5vZGUucmlnaHRcbiAgICAgICAgICAgID8gUmVkQmxhY2tOb2RlLmZyb20obm9kZS5yaWdodClcbiAgICAgICAgICAgIDogbnVsbDtcblxuICAgICAgICAgIGlmIChsZWZ0KSB7XG4gICAgICAgICAgICBsZWZ0LnBhcmVudCA9IG5vZGU7XG4gICAgICAgICAgICBub2Rlcy5wdXNoKGxlZnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmlnaHQpIHtcbiAgICAgICAgICAgIHJpZ2h0LnBhcmVudCA9IG5vZGU7XG4gICAgICAgICAgICBub2Rlcy5wdXNoKHJpZ2h0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gKG9wdGlvbnM/LmNvbXBhcmVcbiAgICAgICAgPyBuZXcgUmVkQmxhY2tUcmVlKG9wdGlvbnMuY29tcGFyZSlcbiAgICAgICAgOiBuZXcgUmVkQmxhY2tUcmVlKCkpIGFzIFJlZEJsYWNrVHJlZTxVPjtcbiAgICAgIHVubWFwcGVkVmFsdWVzID0gY29sbGVjdGlvbjtcbiAgICB9XG4gICAgY29uc3QgdmFsdWVzOiBJdGVyYWJsZTxVPiA9IG9wdGlvbnM/Lm1hcFxuICAgICAgPyBBcnJheS5mcm9tKHVubWFwcGVkVmFsdWVzLCBvcHRpb25zLm1hcCwgb3B0aW9ucy50aGlzQXJnKVxuICAgICAgOiB1bm1hcHBlZFZhbHVlcyBhcyBVW107XG4gICAgZm9yIChjb25zdCB2YWx1ZSBvZiB2YWx1ZXMpIHJlc3VsdC5pbnNlcnQodmFsdWUpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVtb3ZlRml4dXAoXG4gICAgcGFyZW50OiBSZWRCbGFja05vZGU8VD4gfCBudWxsLFxuICAgIGN1cnJlbnQ6IFJlZEJsYWNrTm9kZTxUPiB8IG51bGwsXG4gICkge1xuICAgIHdoaWxlIChwYXJlbnQgJiYgIWN1cnJlbnQ/LnJlZCkge1xuICAgICAgY29uc3QgZGlyZWN0aW9uOiBEaXJlY3Rpb24gPSBwYXJlbnQubGVmdCA9PT0gY3VycmVudCA/IFwibGVmdFwiIDogXCJyaWdodFwiO1xuICAgICAgY29uc3Qgc2libGluZ0RpcmVjdGlvbjogRGlyZWN0aW9uID0gZGlyZWN0aW9uID09PSBcInJpZ2h0XCJcbiAgICAgICAgPyBcImxlZnRcIlxuICAgICAgICA6IFwicmlnaHRcIjtcbiAgICAgIGxldCBzaWJsaW5nOiBSZWRCbGFja05vZGU8VD4gfCBudWxsID0gcGFyZW50W3NpYmxpbmdEaXJlY3Rpb25dO1xuXG4gICAgICBpZiAoc2libGluZz8ucmVkKSB7XG4gICAgICAgIHNpYmxpbmcucmVkID0gZmFsc2U7XG4gICAgICAgIHBhcmVudC5yZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnJvdGF0ZU5vZGUocGFyZW50LCBkaXJlY3Rpb24pO1xuICAgICAgICBzaWJsaW5nID0gcGFyZW50W3NpYmxpbmdEaXJlY3Rpb25dO1xuICAgICAgfVxuICAgICAgaWYgKHNpYmxpbmcpIHtcbiAgICAgICAgaWYgKCFzaWJsaW5nLmxlZnQ/LnJlZCAmJiAhc2libGluZy5yaWdodD8ucmVkKSB7XG4gICAgICAgICAgc2libGluZyEucmVkID0gdHJ1ZTtcbiAgICAgICAgICBjdXJyZW50ID0gcGFyZW50O1xuICAgICAgICAgIHBhcmVudCA9IGN1cnJlbnQucGFyZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghc2libGluZ1tzaWJsaW5nRGlyZWN0aW9uXT8ucmVkKSB7XG4gICAgICAgICAgICBzaWJsaW5nW2RpcmVjdGlvbl0hLnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgc2libGluZy5yZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yb3RhdGVOb2RlKHNpYmxpbmcsIHNpYmxpbmdEaXJlY3Rpb24pO1xuICAgICAgICAgICAgc2libGluZyA9IHBhcmVudFtzaWJsaW5nRGlyZWN0aW9uIV07XG4gICAgICAgICAgfVxuICAgICAgICAgIHNpYmxpbmchLnJlZCA9IHBhcmVudC5yZWQ7XG4gICAgICAgICAgcGFyZW50LnJlZCA9IGZhbHNlO1xuICAgICAgICAgIHNpYmxpbmchW3NpYmxpbmdEaXJlY3Rpb25dIS5yZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnJvdGF0ZU5vZGUocGFyZW50LCBkaXJlY3Rpb24pO1xuICAgICAgICAgIGN1cnJlbnQgPSB0aGlzLnJvb3Q7XG4gICAgICAgICAgcGFyZW50ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY3VycmVudCkgY3VycmVudC5yZWQgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHRoZSB2YWx1ZSB0byB0aGUgYmluYXJ5IHNlYXJjaCB0cmVlIGlmIGl0IGRvZXMgbm90IGFscmVhZHkgZXhpc3QgaW4gaXQuXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBzdWNjZXNzZnVsLlxuICAgKi9cbiAgb3ZlcnJpZGUgaW5zZXJ0KHZhbHVlOiBUKTogYm9vbGVhbiB7XG4gICAgbGV0IG5vZGUgPSB0aGlzLmluc2VydE5vZGUoUmVkQmxhY2tOb2RlLCB2YWx1ZSkgYXMgKFJlZEJsYWNrTm9kZTxUPiB8IG51bGwpO1xuICAgIGlmIChub2RlKSB7XG4gICAgICB3aGlsZSAobm9kZS5wYXJlbnQ/LnJlZCkge1xuICAgICAgICBsZXQgcGFyZW50OiBSZWRCbGFja05vZGU8VD4gPSBub2RlLnBhcmVudCE7XG4gICAgICAgIGNvbnN0IHBhcmVudERpcmVjdGlvbjogRGlyZWN0aW9uID0gcGFyZW50LmRpcmVjdGlvbkZyb21QYXJlbnQoKSE7XG4gICAgICAgIGNvbnN0IHVuY2xlRGlyZWN0aW9uOiBEaXJlY3Rpb24gPSBwYXJlbnREaXJlY3Rpb24gPT09IFwicmlnaHRcIlxuICAgICAgICAgID8gXCJsZWZ0XCJcbiAgICAgICAgICA6IFwicmlnaHRcIjtcbiAgICAgICAgY29uc3QgdW5jbGU6IFJlZEJsYWNrTm9kZTxUPiB8IG51bGwgPSBwYXJlbnQucGFyZW50IVt1bmNsZURpcmVjdGlvbl0gPz9cbiAgICAgICAgICBudWxsO1xuXG4gICAgICAgIGlmICh1bmNsZT8ucmVkKSB7XG4gICAgICAgICAgcGFyZW50LnJlZCA9IGZhbHNlO1xuICAgICAgICAgIHVuY2xlLnJlZCA9IGZhbHNlO1xuICAgICAgICAgIHBhcmVudC5wYXJlbnQhLnJlZCA9IHRydWU7XG4gICAgICAgICAgbm9kZSA9IHBhcmVudC5wYXJlbnQhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChub2RlID09PSBwYXJlbnRbdW5jbGVEaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICBub2RlID0gcGFyZW50O1xuICAgICAgICAgICAgdGhpcy5yb3RhdGVOb2RlKG5vZGUsIHBhcmVudERpcmVjdGlvbik7XG4gICAgICAgICAgICBwYXJlbnQgPSBub2RlLnBhcmVudCE7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhcmVudC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICBwYXJlbnQucGFyZW50IS5yZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucm90YXRlTm9kZShwYXJlbnQucGFyZW50ISwgdW5jbGVEaXJlY3Rpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnJvb3QhLnJlZCA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gISFub2RlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgbm9kZSB2YWx1ZSBmcm9tIHRoZSBiaW5hcnkgc2VhcmNoIHRyZWUgaWYgZm91bmQuXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBmb3VuZCBhbmQgcmVtb3ZlZC5cbiAgICovXG4gIG92ZXJyaWRlIHJlbW92ZSh2YWx1ZTogVCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLnJlbW92ZU5vZGUodmFsdWUpIGFzIChSZWRCbGFja05vZGU8VD4gfCBudWxsKTtcbiAgICBpZiAobm9kZSAmJiAhbm9kZS5yZWQpIHtcbiAgICAgIHRoaXMucmVtb3ZlRml4dXAobm9kZS5wYXJlbnQsIG5vZGUubGVmdCA/PyBub2RlLnJpZ2h0KTtcbiAgICB9XG4gICAgcmV0dXJuICEhbm9kZTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBFQUEwRTtBQUMxRSx1Q0FBdUMsR0FFdkMsU0FBUyxNQUFNLEVBQUUsZ0JBQWdCLFFBQVEseUJBQXlCLENBQUM7QUFDbkUsU0FBb0IsWUFBWSxRQUFRLHFCQUFxQixDQUFDO0FBQzlELGNBQWMsbUJBQW1CLENBQUM7QUFFbEM7Ozs7Q0FJQyxHQUNELE9BQU8sTUFBTSxZQUFZLFNBQVksZ0JBQWdCO0lBR25ELFlBQ0UsT0FBK0IsR0FBRyxNQUFNLENBQ3hDO1FBQ0EsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pCO1dBcUJnQixJQUFJLENBQ2xCLFVBQXdELEVBQ3hELE9BSUMsRUFDZ0I7UUFDakIsSUFBSSxNQUFNLEFBQWlCLEFBQUM7UUFDNUIsSUFBSSxjQUFjLEdBQStCLEVBQUUsQUFBQztRQUNwRCxJQUFJLFVBQVUsWUFBWSxZQUFZLEVBQUU7WUFDdEMsTUFBTSxHQUFHLElBQUksWUFBWSxDQUN2QixPQUFPLEVBQUUsT0FBTyxJQUFJLEFBQUMsVUFBVSxDQUFnQyxPQUFPLENBQ3ZFLENBQUM7WUFDRixJQUFJLE9BQU8sRUFBRSxPQUFPLElBQUksT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDcEMsY0FBYyxHQUFHLFVBQVUsQ0FBQztZQUM5QixPQUFPO2dCQUNMLE1BQU0sS0FBSyxHQUFzQixFQUFFLEFBQUM7Z0JBQ3BDLElBQUksVUFBVSxDQUFDLElBQUksRUFBRTtvQkFDbkIsTUFBTSxDQUFDLElBQUksR0FBRyxZQUFZLENBQUMsSUFBSSxDQUM3QixVQUFVLENBQUMsSUFBSSxDQUNoQixDQUFDO29CQUNGLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMxQixDQUFDO2dCQUNELE1BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBRTtvQkFDbkIsTUFBTSxJQUFJLEdBQW9CLEtBQUssQ0FBQyxHQUFHLEVBQUUsQUFBQyxBQUFDO29CQUMzQyxNQUFNLElBQUksR0FBMkIsSUFBSSxDQUFDLElBQUksR0FDMUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQzVCLElBQUksQUFBQztvQkFDVCxNQUFNLEtBQUssR0FBMkIsSUFBSSxDQUFDLEtBQUssR0FDNUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQzdCLElBQUksQUFBQztvQkFFVCxJQUFJLElBQUksRUFBRTt3QkFDUixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzt3QkFDbkIsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDbkIsQ0FBQztvQkFDRCxJQUFJLEtBQUssRUFBRTt3QkFDVCxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzt3QkFDcEIsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDcEIsQ0FBQztnQkFDSCxDQUFDO1lBQ0gsQ0FBQztRQUNILE9BQU87WUFDTCxNQUFNLEdBQUksT0FBTyxFQUFFLE9BQU8sR0FDdEIsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUNqQyxJQUFJLFlBQVksRUFBRSxBQUFvQixDQUFDO1lBQzNDLGNBQWMsR0FBRyxVQUFVLENBQUM7UUFDOUIsQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFnQixPQUFPLEVBQUUsR0FBRyxHQUNwQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FDeEQsY0FBYyxBQUFPLEFBQUM7UUFDMUIsS0FBSyxNQUFNLEtBQUssSUFBSSxNQUFNLENBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRCxPQUFPLE1BQU0sQ0FBQztJQUNoQjtJQUVVLFdBQVcsQ0FDbkIsTUFBOEIsRUFDOUIsT0FBK0IsRUFDL0I7UUFDQSxNQUFPLE1BQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUU7WUFDOUIsTUFBTSxTQUFTLEdBQWMsTUFBTSxDQUFDLElBQUksS0FBSyxPQUFPLEdBQUcsTUFBTSxHQUFHLE9BQU8sQUFBQztZQUN4RSxNQUFNLGdCQUFnQixHQUFjLFNBQVMsS0FBSyxPQUFPLEdBQ3JELE1BQU0sR0FDTixPQUFPLEFBQUM7WUFDWixJQUFJLE9BQU8sR0FBMkIsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEFBQUM7WUFFL0QsSUFBSSxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUNoQixPQUFPLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztnQkFDcEIsTUFBTSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNuQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFDckMsQ0FBQztZQUNELElBQUksT0FBTyxFQUFFO2dCQUNYLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO29CQUM3QyxPQUFPLENBQUUsR0FBRyxHQUFHLElBQUksQ0FBQztvQkFDcEIsT0FBTyxHQUFHLE1BQU0sQ0FBQztvQkFDakIsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQzFCLE9BQU87b0JBQ0wsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLEdBQUcsRUFBRTt3QkFDbkMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFFLEdBQUcsR0FBRyxLQUFLLENBQUM7d0JBQ2hDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO3dCQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO3dCQUMzQyxPQUFPLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFFLENBQUM7b0JBQ3RDLENBQUM7b0JBQ0QsT0FBTyxDQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDO29CQUMxQixNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztvQkFDbkIsT0FBTyxBQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBRSxHQUFHLEdBQUcsS0FBSyxDQUFDO29CQUN4QyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztvQkFDbkMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7b0JBQ3BCLE1BQU0sR0FBRyxJQUFJLENBQUM7Z0JBQ2hCLENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUNELElBQUksT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQ25DO0lBRUE7OztHQUdDLEdBQ1EsTUFBTSxDQUFDLEtBQVEsRUFBVztRQUNqQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQUFBNEIsQUFBQztRQUM1RSxJQUFJLElBQUksRUFBRTtZQUNSLE1BQU8sSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUU7Z0JBQ3ZCLElBQUksTUFBTSxHQUFvQixJQUFJLENBQUMsTUFBTSxBQUFDLEFBQUM7Z0JBQzNDLE1BQU0sZUFBZSxHQUFjLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxBQUFDLEFBQUM7Z0JBQ2pFLE1BQU0sY0FBYyxHQUFjLGVBQWUsS0FBSyxPQUFPLEdBQ3pELE1BQU0sR0FDTixPQUFPLEFBQUM7Z0JBQ1osTUFBTSxLQUFLLEdBQTJCLE1BQU0sQ0FBQyxNQUFNLEFBQUMsQ0FBQyxjQUFjLENBQUMsSUFDbEUsSUFBSSxBQUFDO2dCQUVQLElBQUksS0FBSyxFQUFFLEdBQUcsRUFBRTtvQkFDZCxNQUFNLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztvQkFDbkIsS0FBSyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7b0JBQ2xCLE1BQU0sQ0FBQyxNQUFNLENBQUUsR0FBRyxHQUFHLElBQUksQ0FBQztvQkFDMUIsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEFBQUMsQ0FBQztnQkFDeEIsT0FBTztvQkFDTCxJQUFJLElBQUksS0FBSyxNQUFNLENBQUMsY0FBYyxDQUFDLEVBQUU7d0JBQ25DLElBQUksR0FBRyxNQUFNLENBQUM7d0JBQ2QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7d0JBQ3ZDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxBQUFDLENBQUM7b0JBQ3hCLENBQUM7b0JBQ0QsTUFBTSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7b0JBQ25CLE1BQU0sQ0FBQyxNQUFNLENBQUUsR0FBRyxHQUFHLElBQUksQ0FBQztvQkFDMUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFHLGNBQWMsQ0FBQyxDQUFDO2dCQUNsRCxDQUFDO1lBQ0gsQ0FBQztZQUNELElBQUksQ0FBQyxJQUFJLENBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQztRQUN6QixDQUFDO1FBQ0QsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ2hCO0lBRUE7OztHQUdDLEdBQ1EsTUFBTSxDQUFDLEtBQVEsRUFBVztRQUNqQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxBQUE0QixBQUFDO1FBQ2hFLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNyQixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekQsQ0FBQztRQUNELE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNoQjtDQUNEIn0=