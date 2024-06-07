class BPlusTreeNode {
    constructor(order, isLeaf = false) {
      this.order = order;
      this.isLeaf = isLeaf;
      this.keys = [];
      this.children = [];
    }
  
    isFull() {
      return this.keys.length >= this.order - 1;
    }
  
    findIndex(key) {
      for (let i = 0; i < this.keys.length; i++) {
        if (this.keys[i] >= key) return i;
      }
      return this.keys.length;
    }
  }
  
  class BPlusTree {
    constructor(order) {
      this.root = new BPlusTreeNode(order, true);
      this.order = order;
    }
  
    insert(key) {
      const root = this.root;
      if (root.isFull()) {
        const newRoot = new BPlusTreeNode(this.order);
        newRoot.children.push(this.root);
        this.splitChild(newRoot, 0);
        this.root = newRoot;
      }
      this._insertNonFull(this.root, key);
      this.visualize();
    }
  
    _insertNonFull(node, key) {
      if (node.isLeaf) {
        const index = node.findIndex(key);
        node.keys.splice(index, 0, key);
      } else {
        const index = node.findIndex(key);
        if (node.children[index].isFull()) {
          this.splitChild(node, index);
          if (key > node.keys[index]) index++;
        }
        this._insertNonFull(node.children[index], key);
      }
    }
  
    splitChild(parent, index) {
      const node = parent.children[index];
      const midIndex = Math.floor((this.order - 1) / 2);
  
      const newNode = new BPlusTreeNode(this.order, node.isLeaf);
      parent.keys.splice(index, 0, node.keys[midIndex]);
      parent.children.splice(index + 1, 0, newNode);
  
      newNode.keys = node.keys.splice(midIndex + 1);
      if (!node.isLeaf) {
        newNode.children = node.children.splice(midIndex + 1);
      }
    }
  
    delete(key) {
      this._delete(this.root, key);
      if (this.root.keys.length === 0 && !this.root.isLeaf) {
        this.root = this.root.children[0];
      }
      this.visualize();
    }
  
    _delete(node, key) {
      const index = node.findIndex(key);
      if (node.isLeaf) {
        if (node.keys[index] === key) node.keys.splice(index, 1);
      } else {
        if (node.keys[index] === key) {
          if (node.children[index].keys.length >= Math.ceil((this.order - 1) / 2)) {
            node.keys[index] = this._deletePredecessor(node.children[index]);
          } else if (node.children[index + 1].keys.length >= Math.ceil((this.order - 1) / 2)) {
            node.keys[index] = this._deleteSuccessor(node.children[index + 1]);
          } else {
            this._mergeChildren(node, index);
            this._delete(node.children[index], key);
          }
        } else {
          if (node.children[index].keys.length < Math.ceil((this.order - 1) / 2)) {
            if (index > 0 && node.children[index - 1].keys.length >= Math.ceil((this.order - 1) / 2)) {
              this._borrowFromPrev(node, index);
            } else if (index < node.keys.length && node.children[index + 1].keys.length >= Math.ceil((this.order - 1) / 2)) {
              this._borrowFromNext(node, index);
            } else {
              if (index < node.keys.length) {
                this._mergeChildren(node, index);
              } else {
                this._mergeChildren(node, index - 1);
                index--;
              }
            }
          }
          this._delete(node.children[index], key);
        }
      }
    }
  
    _deletePredecessor(node) {
      while (!node.isLeaf) {
        node = node.children[node.keys.length];
      }
      return node.keys.pop();
    }
  
    _deleteSuccessor(node) {
      while (!node.isLeaf) {
        node = node.children[0];
      }
      return node.keys.shift();
    }
  
    _mergeChildren(parent, index) {
      const leftChild = parent.children[index];
      const rightChild = parent.children.splice(index + 1, 1)[0];
      leftChild.keys.push(parent.keys.splice(index, 1)[0], ...rightChild.keys);
      if (!leftChild.isLeaf) {
        leftChild.children.push(...rightChild.children);
      }
    }
  
    _borrowFromPrev(parent, index) {
      const child = parent.children[index];
      const sibling = parent.children[index - 1];
  
      child.keys.unshift(parent.keys[index - 1]);
      parent.keys[index - 1] = sibling.keys.pop();
  
      if (!child.isLeaf) {
        child.children.unshift(sibling.children.pop());
      }
    }
  
    _borrowFromNext(parent, index) {
      const child = parent.children[index];
      const sibling = parent.children[index + 1];
  
      child.keys.push(parent.keys[index]);
      parent.keys[index] = sibling.keys.shift();
  
      if (!child.isLeaf) {
        child.children.push(sibling.children.shift());
      }
    }
  
    visualize() {
      d3.select("#visualization").selectAll("*").remove();
  
      const svgWidth = 1200; // Set a width for the SVG canvas
      const svgHeight = 600; // Set a height for the SVG canvas
  
      const svg = d3.select("#visualization").append("svg")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight)
                    .call(d3.zoom().on("zoom", (event) => {
                      svg.attr("transform", event.transform);
                    }))
                    .append("g");
  
      const nodeHeight = 30;
      const nodeWidth = 40;
  
      const calculateNodeWidth = (node) => {
        return node.keys.length * nodeWidth + (node.keys.length - 1) * 20;
      };
  
      const calculatePositions = (node, depth = 0, posX = 0) => {
        if (!node) return posX;
  
        if (!node.isLeaf) {
          let childX = posX;
          node.children.forEach((child, i) => {
            childX = calculatePositions(child, depth + 1, childX);
          });
  
          const firstChildPos = node.children[0]._x;
          const lastChildPos = node.children[node.children.length - 1]._x;
          node._x = (firstChildPos + lastChildPos) / 2;
        } else {
          node._x = posX + calculateNodeWidth(node) / 2;
        }
        node._y = depth * (nodeHeight + 50);
  
        return node._x + calculateNodeWidth(node) / 2 + 20;
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
             .data(node.keys)
             .enter()
             .append("text")
             .attr("x", (d, i) => -calculateNodeWidth(node) / 2 + nodeWidth / 2 + i * (nodeWidth + 20))
             .attr("y", nodeHeight / 2)
             .attr("text-anchor", "middle")
             .attr("alignment-baseline", "middle")
             .text(d => d);
  
        if (!node.isLeaf) {
          node.children.forEach((child) => {
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
  
      const adjustWidths = (node) => {
        if (!node) return 0;
  
        if (node.isLeaf) {
          node._width = calculateNodeWidth(node);
        } else {
          node._width = 0;
          node.children.forEach((child) => {
            node._width += adjustWidths(child) + 20;
          });
        }
        return node._width;
      };
  
      adjustWidths(this.root);
      calculatePositions(this.root);
      renderNode(this.root);
    }
  }
  
  // Initialization and Functions
  let bptree = null;
  
  function createTree() {
    const order = prompt("Enter the order (number of pointers per node) for the B+ tree:");
    if (order && parseInt(order) > 2) {
      bptree = new BPlusTree(parseInt(order));
      bptree.visualize();
    } else {
      alert("Please enter a valid order greater than 2.");
    }
  }
  
  function insertElement() {
    if (!bptree) {
      alert("Please create the tree first.");
      return;
    }
    const key = prompt("Enter key to insert:");
    if (key) {
      bptree.insert(parseInt(key));
    }
  }
  
  function deleteElement() {
    if (!bptree) {
      alert("Please create the tree first.");
      return;
    }
    const key = prompt("Enter key to delete:");
    if (key) {
      bptree.delete(parseInt(key));
    }
  }
  
  function insertRandomElement() {
    if (!bptree) {
      alert("Please create the tree first.");
      return;
    }
    const key = Math.floor(Math.random() * 100); // Generates a random number between 0 and 99
    bptree.insert(key);
    alert(`Random key ${key} inserted into the tree.`);
  }
  