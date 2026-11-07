/// Simple storage for keeping track of which audio files exist for each speaker.
export default class AudioLibrary {
	audioForSpeaker: Record<string, Record<string, PronunciationAudio>>;

	constructor() {
		this.audioForSpeaker = {};
	}

	addAudio(speaker: string, pronunciation: string, file: string): void {
		if (!this.audioForSpeaker[speaker]) {
			this.audioForSpeaker[speaker] = {};
		}
		this.audioForSpeaker[speaker][pronunciation] = {
			'file': file,
			'speaker': speaker
		};
	}

	// TODO the following function is temporary, until #269 is implemented and
	// we can implement this properly
	private syllablesAndStressToPronunciation(syllables: string, stress: number): string {
		if (!syllables.includes('-')) {
			return syllables;
		}
		let syllablesArray = syllables.split('-');
		syllablesArray[stress - 1] = '[' + syllablesArray[stress - 1] + ']';
		return syllablesArray.join('-');
	}

	/// Returns a reference to a pronunciation audio file, or `null` if an audio
	/// file is not available for the given speaker and pronunciation.
	// TODO remove wordType parameter after implementing #269
	getAudio(syllables: string, stress: number, wordType: string): PronunciationAudio[] {
		let pronunciation = this.syllablesAndStressToPronunciation(syllables, stress);  // TODO
		pronunciation = pronunciation.replaceAll('ù', 'u');
		if (wordType === 'n:si') {
			pronunciation += ' si';
		}

		let result: PronunciationAudio[] = [];
		for (let speaker of Object.keys(this.audioForSpeaker)) {
			if (this.audioForSpeaker[speaker][pronunciation]) {
				result.push(this.audioForSpeaker[speaker][pronunciation]);
			}
		}
		return result;
	}
}
