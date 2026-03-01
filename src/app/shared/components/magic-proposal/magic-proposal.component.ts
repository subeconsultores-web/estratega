import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-magic-proposal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './magic-proposal.component.html',
    styleUrls: ['./magic-proposal.component.scss']
})
export class MagicProposalComponent implements OnInit {
    @ViewChild('proposalCard') cardRef!: ElementRef<HTMLElement>;

    public clientName: string = 'Tech Nova Inc.';
    public proposalTitle: string = 'Estrategia de Transformación Digital IA';
    public totalValue: number = 45000;

    // 3D effect state
    public rotateX = 0;
    public rotateY = 0;
    public translateZ = 0;
    public glareX = 50;
    public glareY = 50;
    public isHovered = false;

    private readonly MAX_ROTATION = 10; // degrees

    ngOnInit() { }

    @HostListener('mousemove', ['$event'])
    onMouseMove(event: MouseEvent) {
        if (!this.cardRef || !this.isHovered) return;

        const card = this.cardRef.nativeElement;
        const rect = card.getBoundingClientRect();

        // Calculate mouse position relative to the center of the card
        const x = event.clientX - rect.left; // x position within the element.
        const y = event.clientY - rect.top;  // y position within the element.

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const percentX = (x - centerX) / centerX;
        const percentY = (y - centerY) / centerY;

        // Determine rotation (invert Y so tilting feels natural)
        this.rotateY = percentX * this.MAX_ROTATION;
        this.rotateX = -(percentY * this.MAX_ROTATION);

        // Calculate glare position
        this.glareX = (x / rect.width) * 100;
        this.glareY = (y / rect.height) * 100;
    }

    @HostListener('mouseenter')
    onMouseEnter() {
        this.isHovered = true;
        this.translateZ = 50; // Pop out
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        this.isHovered = false;
        // Reset to neutral
        this.rotateX = 0;
        this.rotateY = 0;
        this.translateZ = 0;
        this.glareX = 50;
        this.glareY = 50;
    }
}
