class Node {
    constructor(order) {
        this.order = order;
        this.values = [];
        this.keys = [];
        this.nextKey = null;
        this.parent = null;
        this.checkLeaf = false;
    }

    insertAtLeaf(value) {
        if (this.values.length) {
            for (let i = 0; i < this.values.length; i++) {
                if (value === this.values[i]) {
                    return;
                } else if (value < this.values[i]) {
                    this.values.splice(i, 0, value);
                    break;
                } else if (i + 1 === this.values.length) {
                    this.values.push(value);
                    break;
                }
            }
        } else {
            this.values = [value];
        }
        
    }
}

class BplusTree {
    constructor(order) {
        this.root = new Node(order);
        this.root.checkLeaf = true;
    }

    cloneNode(node) {
        const newNode = new Node(node.order);
        newNode.values = [...node.values];
        newNode.keys = node.keys.map(key => Array.isArray(key) ? [...key] : this.cloneNode(key));
        newNode.nextKey = node.nextKey;
        newNode.parent = node.parent;
        newNode.checkLeaf = node.checkLeaf;
        return newNode;
    }

    clone() {
        const newTree = new BplusTree(this.root.order);
        newTree.root = this.cloneNode(this.root);
        return newTree;
    }

    insert(value) {
        value = parseInt(value, 10);
        saveState(); // Save state before modification
        const oldNode = this.search(value);
        oldNode.insertAtLeaf(value);

        if (oldNode.values.length === oldNode.order) {
            const node1 = new Node(oldNode.order);
            node1.checkLeaf = true;
            node1.parent = oldNode.parent;
            const mid = Math.ceil(oldNode.order / 2) - 1;
            node1.values = oldNode.values.slice(mid + 1);
            node1.keys = oldNode.keys.slice(mid + 1);
            node1.nextKey = oldNode.nextKey;
            oldNode.values = oldNode.values.slice(0, mid + 1);
            oldNode.keys = oldNode.keys.slice(0, mid + 1);
            oldNode.nextKey = node1;
            this.insertInParent(oldNode, node1.values[0], node1);
        }
    }

    search(value) {
        value = parseInt(value, 10);
        let currentNode = this.root;
        while (!currentNode.checkLeaf) {
            for (let i = 0; i < currentNode.values.length; i++) {
                if (value === currentNode.values[i]) {
                    currentNode = currentNode.keys[i + 1];
                    break;
                } else if (value < currentNode.values[i]) {
                    currentNode = currentNode.keys[i];
                    break;
                } else if (i + 1 === currentNode.values.length) {
                    currentNode = currentNode.keys[i + 1];
                    break;
                }
            }
        }
        return currentNode;
        
    }

    delete(value) {
        value = parseInt(value, 10);
        saveState(); // Save state before modification
        const node_ = this.search(value);
        let found = false;
        
        for (let i = 0; i < node_.values.length; i++) {
            if (node_.values[i] === value) {
                found = true;
                if (node_ === this.root) {
                    node_.values.splice(i, 1);
                } else {
                    node_.values.splice(i, 1);
                    this.deleteEntry(node_, value);
                }
                break;
            }
        }
        if (!found) {
            console.log("Value not in Tree");
            return;
        }
        
    }

    insertInParent(n, value, ndash) {
        if (this.root === n) {
            const rootNode = new Node(n.order);
            rootNode.values = [value];
            rootNode.keys = [n, ndash];
            this.root = rootNode;
            n.parent = rootNode;
            ndash.parent = rootNode;
            return;
        }

        const parentNode = n.parent;
        for (let i = 0; i < parentNode.keys.length; i++) {
            if (parentNode.keys[i] === n) {
                parentNode.values.splice(i, 0, value);
                parentNode.keys.splice(i + 1, 0, ndash);
                if (parentNode.keys.length > parentNode.order) {
                    const parentdash = new Node(parentNode.order);
                    parentdash.parent = parentNode.parent;
                    const mid = Math.ceil(parentNode.order / 2) - 1;
                    parentdash.values = parentNode.values.slice(mid + 1);
                    parentdash.keys = parentNode.keys.slice(mid + 1);
                    const value_ = parentNode.values[mid];
                    parentNode.values = parentNode.values.slice(0, mid);
                    parentNode.keys = parentNode.keys.slice(0, mid + 1);
                    for (const child of parentNode.keys) {
                        child.parent = parentNode;
                    }
                    for (const child of parentdash.keys) {
                        child.parent = parentdash;
                    }
                    this.insertInParent(parentNode, value_, parentdash);
                }
                break;
            }
        }
    }

    deleteEntry(node_, value) {
        if (!node_.checkLeaf) {
            for (let i = 0; i < node_.keys.length; i++) {
                if (node_.values[i] === value) {
                    node_.values.splice(i, 1);
                    node_.keys.splice(i + 1, 1);
                    break;
                }
            }
        }

        if (this.root === node_ && node_.keys.length === 1) {
            this.root = node_.keys[0];
            this.root.parent = null;
            return;
        }

        const minKeys = Math.ceil(node_.order / 2);
        const parentNode = node_.parent;
        let sibling, siblingValue, isPrevSibling = false;

        for (let i = 0; i < parentNode.keys.length; i++) {
            if (parentNode.keys[i] === node_) {
                if (i > 0) {
                    sibling = parentNode.keys[i - 1];
                    siblingValue = parentNode.values[i - 1];
                    isPrevSibling = true;
                } else if (i < parentNode.keys.length - 1) {
                    sibling = parentNode.keys[i + 1];
                    siblingValue = parentNode.values[i];
                }
                break;
            }
        }

        if (node_.values.length + sibling.values.length < node_.order) {
            if (!isPrevSibling) {
                [node_, sibling] = [sibling, node_];
            }
            sibling.keys = sibling.keys.concat(node_.keys);
            if (!node_.checkLeaf) {
                sibling.values.push(siblingValue);
            } else {
                sibling.nextKey = node_.nextKey;
            }
            sibling.values = sibling.values.concat(node_.values);
            for (const child of sibling.keys) {
                child.parent = sibling;
            }
            this.deleteEntry(parentNode, siblingValue);
        } else {
            if (isPrevSibling) {
                if (!node_.checkLeaf) {
                    const moveKey = sibling.keys.pop();
                    const moveValue = sibling.values.pop();
                    node_.keys.unshift(moveKey);
                    node_.values.unshift(siblingValue);
                    parentNode.values[parentNode.values.indexOf(siblingValue)] = moveValue;
                } else {
                    const moveValue = sibling.values.pop();
                    node_.values.unshift(moveValue);
                    parentNode.values[parentNode.values.indexOf(siblingValue)] = moveValue;
                }
            } else {
                if (!node_.checkLeaf) {
                    const moveKey = sibling.keys.shift();
                    const moveValue = sibling.values.shift();
                    node_.keys.push(moveKey);
                    node_.values.push(siblingValue);
                    parentNode.values[parentNode.values.indexOf(siblingValue)] = moveValue;
                } else {
                    const moveValue = sibling.values.shift();
                    node_.values.push(moveValue);
                    parentNode.values[parentNode.values.indexOf(siblingValue)] = sibling.values[0];
                }
            }
        }
    }

    visualize() {
        d3.select("#visualization").selectAll("*").remove();

        const svgWidth = window.innerWidth; // Set width to window width
        const svgHeight = window.innerHeight; // Set height to window height

        const svg = d3.select("#visualization").append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .call(d3.zoom().on("zoom", (event) => {
                svg.attr("transform", event.transform);
            }))
            .append("g");

        const nodeHeight = 30;
        const nodeWidth = 40;
        const nodeSpacing = 20;

        const calculateNodeWidth = (node) => {
            return node.values.length * nodeWidth + (node.values.length - 1) * nodeSpacing;
        };

        let temp = 0;
        const calculatePositions = (node, depth = 0, posX = 0) => {
            if (!node) return posX;

            if (!node.checkLeaf) {
                let currentX = posX;
                node.keys.forEach((child, i) => {
                    currentX = calculatePositions(child, depth + 1, currentX);
                    if (i < node.values.length) {
                        currentX += nodeSpacing;
                    }
                });

                const firstChildPos = node.keys[0]._x;
                const lastChildPos = node.keys[node.keys.length - 1]._x;
                node._x = (firstChildPos + lastChildPos) / 2;
            } else {
                node._x = temp + calculateNodeWidth(node) ;
                temp = node._x +  node.values.length * nodeSpacing;
            }
            node._y = 20+ depth * (nodeHeight + 100);

            return node._x + calculateNodeWidth(node) / 2 + nodeSpacing;
        };

        const renderNode = (node) => {
            if (!node) return;

            const group = svg.append("g")
                .attr("transform", `translate(${node._x}, ${node._y})`);

            group.append("rect")
                .attr("x", -calculateNodeWidth(node) / 2)
                .attr("y", 0)
                .attr("width", calculateNodeWidth(node))
                .attr("height", nodeHeight)
                .attr("fill", "lightblue")
                .attr("stroke", "black");

            group.selectAll("text")
                .data(node.values)
                .enter()
                .append("text")
                .attr("x", (d, i) => -calculateNodeWidth(node) / 2 + nodeWidth / 2 + i * (nodeWidth + nodeSpacing))
                .attr("y", nodeHeight / 2)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .text(d => d);

            if (!node.checkLeaf) {
                node.keys.forEach((child) => {
                    renderNode(child);
                    svg.append("line")
                        .attr("x1", node._x)
                        .attr("y1", node._y + nodeHeight)
                        .attr("x2", child._x)
                        .attr("y2", child._y)
                        .attr("stroke", "black");
                });
            }
        };

        calculatePositions(this.root);
        renderNode(this.root);
    }
}

let tree;
const historyStack = [];

function saveState() {
    if (tree) {
        historyStack.push(tree.clone());
    }
}

function undo() {
    if (historyStack.length > 0) {
        tree = historyStack.pop();
        tree.visualize();
    } else {
        console.log("No operations to undo");
    }
}

function createTree() {
    const order = prompt("Enter the order of the B+ Tree:", 3);
    if (order) {
        tree = new BplusTree(Number(order));
        tree.visualize();
    }
}

function insertElement() {
    const value = parseInt(prompt("Enter the value to insert:"), 10);
    if (!isNaN(value) && tree) {
        tree.insert(value);
        tree.visualize();
    }
}

function insertRandomElement() {
    if (tree) {
        const value = Math.floor(Math.random() * 100);
        tree.insert(value);
        tree.visualize();
    }
}

function deleteElement() {
    const value = parseInt(prompt("Enter the value to delete:"), 10);
    if (!isNaN(value) && tree) {
        tree.delete(value);
        tree.visualize();
    }
}

window.addEve/ntListener('resize', () => {
    if (tree) {
        tree.visualize();
    }
});
