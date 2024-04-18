export class SequenceAlignment {
  alignmentFormat: string = 'fasta';
  alignmentRawContent: string = '';
  alignmentIDs: string[] = [];
  alignmentMap: Map<string, string> = new Map<string, string>();
  conservationScores: number[] = [];
  sequenceType: 'amino-acid'|'nucleotide' = 'amino-acid';
  constructor(alignmentRawContent: string = "", alignmentFormat: string = 'fasta') {
    if (alignmentRawContent !== '') {
      this.alignmentRawContent = alignmentRawContent;
      this.alignmentFormat = alignmentFormat;
      if (alignmentFormat === 'fasta') {
        this.parseFasta(alignmentRawContent);
      }
      this.conservationScores = this.calculateConservation()
    }
  }

  parseFasta(content: string): void {
    this.alignmentRawContent = content;
    this.alignmentMap = new Map<string, string>();
    this.alignmentIDs = [];
    let lines = content.split('\n');
    let id = '';
    let seq = '';
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (line.startsWith('>')) {
        if (id !== '') {
          this.alignmentIDs.push(id);
          this.alignmentMap.set(id, seq);
        }
        id = line.substring(1).trim();
        seq = '';
      } else {
        seq += line.trim();
      }
    }
    if (id !== '') {
      this.alignmentIDs.push(id);
      this.alignmentMap.set(id, seq);
    }
  }

  loadExample(): void {
    this.alignmentRawContent = `>seq1
GATTACA
>seq2
GACTACA
>seq3
GATTACA
>seq4
GACTACA`
    this.parseFasta(this.alignmentRawContent);
  }

  calculateConservation(): number[] {
    const numberOfSequences = this.alignmentIDs.length;
    const firstSequence = this.alignmentMap.get(this.alignmentIDs[0]);
    const conservationScores: number[] = [];
    if (firstSequence) {
      const alignmentLength = firstSequence.length;

      for (let i = 0; i < alignmentLength; i++) {
        const residueCounts: { [residue: string]: number } = {};
        for (let i2 = 0; i2 < numberOfSequences; i2++) {
          const seq = this.alignmentMap.get(this.alignmentIDs[i2]);
          if (seq) {
            const residue = seq[i];
            if (residue !== '-') {
              residueCounts[residue] = (residueCounts[residue] || 0) + 1;
            }

          }
        }

        let entropy = 0;
        for (const residue in residueCounts) {
          const frequencyProportion = residueCounts[residue] / numberOfSequences;
          entropy -= frequencyProportion * Math.log2(frequencyProportion);

        }
        const normalizedEntropy = 1- entropy / Math.log2(numberOfSequences);
        conservationScores.push(normalizedEntropy);
      }
    }
    return conservationScores;
  }
}
