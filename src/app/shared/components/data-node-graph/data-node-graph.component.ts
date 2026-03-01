import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Node {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    label: string;
    type: 'client' | 'project' | 'metric';
}

interface Link {
    source: string;
    target: string;
    strength: number;
}

@Component({
    selector: 'app-data-node-graph',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './data-node-graph.component.html',
    styleUrls: ['./data-node-graph.component.scss']
})
export class DataNodeGraphComponent implements AfterViewInit {
    @ViewChild('networkCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

    private ctx!: CanvasRenderingContext2D;
    private width = 0;
    private height = 0;
    private animationFrameId: number = 0;

    // Simulation parameters
    private friction = 0.9;
    private repulsion = 2000;
    private springLength = 150;
    private springTension = 0.05;

    private nodes: Node[] = [
        { id: 'c1', x: 0, y: 0, vx: 0, vy: 0, radius: 25, color: '#0ea5e9', label: 'TechCorp SA', type: 'client' }, // Cyan
        { id: 'c2', x: 0, y: 0, vx: 0, vy: 0, radius: 20, color: '#db2777', label: 'Global Retail', type: 'client' }, // Magenta
        { id: 'p1', x: 0, y: 0, vx: 0, vy: 0, radius: 15, color: '#10b981', label: 'ERP Web', type: 'project' },     // Emerald
        { id: 'p2', x: 0, y: 0, vx: 0, vy: 0, radius: 15, color: '#10b981', label: 'Mobile App', type: 'project' },  // Emerald
        { id: 'p3', x: 0, y: 0, vx: 0, vy: 0, radius: 18, color: '#10b981', label: 'Cloud Migration', type: 'project' },// Emerald
        { id: 'm1', x: 0, y: 0, vx: 0, vy: 0, radius: 10, color: '#8b5cf6', label: 'Risk: Low', type: 'metric' },    // Violet
        { id: 'm2', x: 0, y: 0, vx: 0, vy: 0, radius: 12, color: '#f59e0b', label: 'Budget: Warn', type: 'metric' }, // Amber
        { id: 'm3', x: 0, y: 0, vx: 0, vy: 0, radius: 10, color: '#8b5cf6', label: 'Health: 98%', type: 'metric' },  // Violet
    ];

    private links: Link[] = [
        { source: 'c1', target: 'p1', strength: 1 },
        { source: 'c1', target: 'p2', strength: 1 },
        { source: 'c2', target: 'p3', strength: 1 },
        { source: 'p1', target: 'm1', strength: 0.5 },
        { source: 'p2', target: 'm2', strength: 0.8 },
        { source: 'p3', target: 'm3', strength: 0.5 },
        { source: 'c1', target: 'c2', strength: 0.2 }, // Subtle industry link
    ];

    private draggedNode: Node | null = null;
    private hoveredNode: Node | null = null;
    private mouseX = 0;
    private mouseY = 0;

    ngAfterViewInit() {
        this.initCanvas();
        this.initNodes();
        this.startSimulation();
    }

    @HostListener('window:resize')
    onResize() {
        this.initCanvas();
    }

    private initCanvas() {
        const canvas = this.canvasRef.nativeElement;
        const parent = canvas.parentElement;

        if (parent) {
            this.width = parent.clientWidth;
            this.height = parent.clientHeight || 400; // Default height if not specified

            // Handle High DPI displays
            const dpr = window.devicePixelRatio || 1;
            canvas.width = this.width * dpr;
            canvas.height = this.height * dpr;

            this.ctx = canvas.getContext('2d')!;
            this.ctx.scale(dpr, dpr);

            canvas.style.width = `${this.width}px`;
            canvas.style.height = `${this.height}px`;
        }
    }

    private initNodes() {
        // Randomize initial positions within bounds
        this.nodes.forEach(node => {
            node.x = this.width / 2 + (Math.random() - 0.5) * 100;
            node.y = this.height / 2 + (Math.random() - 0.5) * 100;
        });
    }

    private startSimulation() {
        const loop = () => {
            this.updatePhysics();
            this.draw();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    private updatePhysics() {
        // 1. Repulsion between all nodes (Coulomb force)
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const n1 = this.nodes[i];
                const n2 = this.nodes[j];
                const dx = n1.x - n2.x;
                const dy = n1.y - n2.y;
                let distSq = dx * dx + dy * dy;

                // Prevent division by zero and excessive force
                if (distSq < 100) distSq = 100;

                const force = this.repulsion / distSq;
                const dist = Math.sqrt(distSq);

                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                n1.vx += fx;
                n1.vy += fy;
                n2.vx -= fx;
                n2.vy -= fy;
            }
        }

        // 2. Attraction along links (Hooke's law)
        this.links.forEach(link => {
            const source = this.nodes.find(n => n.id === link.source);
            const target = this.nodes.find(n => n.id === link.target);
            if (!source || !target) return;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Only apply force if dist is not zero
            if (dist > 0) {
                const force = (dist - this.springLength) * this.springTension * link.strength;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                source.vx += fx;
                source.vy += fy;
                target.vx -= fx;
                target.vy -= fy;
            }
        });

        // 3. Central gravity (keep nodes visible)
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const centerGravity = 0.05;

        // 4. Update positions and apply friction
        this.nodes.forEach(node => {
            // Apply center gravity
            node.vx += (centerX - node.x) * centerGravity;
            node.vy += (centerY - node.y) * centerGravity;

            // Apply friction
            node.vx *= this.friction;
            node.vy *= this.friction;

            // Apply velocity (unless dragged)
            if (this.draggedNode !== node) {
                node.x += node.vx;
                node.y += node.vy;
            }

            // Boundary constraint
            node.x = Math.max(node.radius, Math.min(this.width - node.radius, node.x));
            node.y = Math.max(node.radius, Math.min(this.height - node.radius, node.y));
        });
    }

    private draw() {
        // Clear canvas with transparency for glass effect underlay
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw links
        this.links.forEach(link => {
            const source = this.nodes.find(n => n.id === link.source);
            const target = this.nodes.find(n => n.id === link.target);
            if (!source || !target) return;

            this.ctx.beginPath();
            this.ctx.moveTo(source.x, source.y);
            this.ctx.lineTo(target.x, target.y);

            // Neon line styling
            const gradient = this.ctx.createLinearGradient(source.x, source.y, target.x, target.y);
            gradient.addColorStop(0, `${source.color}80`); // 50% opacity
            gradient.addColorStop(1, `${target.color}80`);

            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = link.strength * 3;

            // Subtle glow for links
            this.ctx.shadowColor = target.color;
            this.ctx.shadowBlur = 5;
            this.ctx.stroke();

            // Reset shadow
            this.ctx.shadowBlur = 0;
        });

        // Draw nodes
        this.nodes.forEach(node => {
            const isHovered = this.hoveredNode === node;
            const isDragged = this.draggedNode === node;

            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, isHovered ? node.radius * 1.2 : node.radius, 0, Math.PI * 2);

            // Fill
            this.ctx.fillStyle = '#0f172a'; // Deep background inside the node
            this.ctx.fill();

            // Neon border & Glow
            this.ctx.strokeStyle = node.color;
            this.ctx.lineWidth = isHovered ? 4 : 2;
            this.ctx.shadowColor = node.color;
            this.ctx.shadowBlur = isHovered ? 30 : 15;
            this.ctx.stroke();

            // Inner solid core
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * 0.4, 0, Math.PI * 2);
            this.ctx.fillStyle = node.color;
            this.ctx.shadowBlur = 0; // Remove shadow for inner core
            this.ctx.fill();
        });

        // Draw Labels (on top of everything)
        this.nodes.forEach(node => {
            const isHovered = this.hoveredNode === node;

            if (isHovered || node.type === 'client') { // Always show client labels, show others on hover
                this.ctx.font = `600 ${isHovered ? 14 : 12}px Inter, sans-serif`;
                this.ctx.fillStyle = '#f8fafc'; // slate-50
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'top';

                // Text shadow for readability against links
                this.ctx.shadowColor = '#020617'; // very dark shadow
                this.ctx.shadowBlur = 4;
                this.ctx.fillText(node.label, node.x, node.y + node.radius + 8);
                this.ctx.shadowBlur = 0; // reset
            }
        });
    }

    // --- Mouse Events ---

    onMouseDown(event: MouseEvent) {
        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;

        // Find clicked node
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            const dx = this.mouseX - node.x;
            const dy = this.mouseY - node.y;
            if (dx * dx + dy * dy <= node.radius * node.radius) {
                this.draggedNode = node;
                // Reset velocity for clean drag
                this.draggedNode.vx = 0;
                this.draggedNode.vy = 0;
                break;
            }
        }
    }

    onMouseMove(event: MouseEvent) {
        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;

        if (this.draggedNode) {
            this.draggedNode.x = this.mouseX;
            this.draggedNode.y = this.mouseY;
        } else {
            // Hover detection
            this.hoveredNode = null;
            for (let i = this.nodes.length - 1; i >= 0; i--) {
                const node = this.nodes[i];
                const dx = this.mouseX - node.x;
                const dy = this.mouseY - node.y;
                if (dx * dx + dy * dy <= node.radius * node.radius) {
                    this.hoveredNode = node;
                    break;
                }
            }

            // Change cursor
            this.canvasRef.nativeElement.style.cursor = this.hoveredNode ? 'grab' : 'default';
        }
    }

    onMouseUp() {
        this.draggedNode = null;
        this.canvasRef.nativeElement.style.cursor = this.hoveredNode ? 'grab' : 'default';
    }

    onMouseLeave() {
        this.draggedNode = null;
        this.hoveredNode = null;
    }

    ngOnDestroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}
