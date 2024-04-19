export class SequenceAlignment {
  alignmentFormat: string = 'fasta';
  alignmentRawContent: string = '';
  alignmentIDs: string[] = [];
  alignmentMap: Map<string, string> = new Map<string, string>();
  conservationScores: number[] = [];
  sequenceType: 'amino-acid'|'nucleotide' = 'amino-acid';
  nucleotideToAminoAcidMap: { [key: string]: string } = {
    'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
    'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
    'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
    'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
    'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
    'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
    'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
    'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
    'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
    'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
    'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
    'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
    'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
    'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
    'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
    'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
  }

  threeFrame: { [key: string]: {[key: string]: {start: number, end: number, residue: string}[]} } = {}

  constructor(alignmentRawContent: string = "", alignmentFormat: string = 'fasta', sequenceType: 'amino-acid'|'nucleotide' = 'amino-acid') {
    if (alignmentRawContent !== '') {
      this.alignmentRawContent = alignmentRawContent;
      this.alignmentFormat = alignmentFormat;
      this.sequenceType = sequenceType;
      if (alignmentFormat === 'fasta') {
        this.parseFasta(alignmentRawContent);
      }
      this.conservationScores = this.calculateConservation()
      if (this.sequenceType === 'nucleotide') {
        this.threeFrameTranslationAll();
      }
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

  threeFrameTranslation(sequenceID: string): { [frame: string]: {start: number, end: number, residue: string}[] } {
    let sequence = this.alignmentMap.get(sequenceID);
    let translation: { [frame: string]: {start: number, end: number, residue: string}[] } = {};
    if (sequence) {
      for (let frame = 0; frame < 3; frame++) {
        let frameTranslation: {start: number, end: number, residue: string}[] = [];
        for (let i = frame; i < sequence.length; i += 3) {
          let codon = sequence.substring(i, i + 3);
          let residue = this.nucleotideToAminoAcidMap[codon];
          if (residue) {
            frameTranslation.push({start: i, end: i + 2, residue: residue});
          }
        }
        translation[frame.toString()] = frameTranslation;
      }
    }
    return translation;
  }

  threeFrameTranslationAll(): void {
    for (let i = 0; i < this.alignmentIDs.length; i++) {
      this.threeFrame[this.alignmentIDs[i]] = this.threeFrameTranslation(this.alignmentIDs[i]);
    }
  }
}
