import { nextMonday, createPlanFileStarter, getAssistantInstructions } from './template.mjs';

const start = document.getElementById('file-start');
const unit = document.getElementById('file-unit');
const download = document.getElementById('download');
const preview = document.getElementById('file-preview');
const status = document.getElementById('download-status');
const copy = document.getElementById('copy-instructions');
const instructions = document.getElementById('assistant-instructions');
const copyStatus = document.getElementById('copy-status');

start.value = nextMonday();
instructions.value = getAssistantInstructions();

function currentFile() {
  return createPlanFileStarter({ startDate: start.value, unit: unit.value });
}

function refreshPreview() {
  try {
    const file = currentFile();
    preview.textContent = JSON.stringify(file, null, 2);
    status.textContent = '';
    download.disabled = false;
  } catch (error) {
    preview.textContent = 'Choose a Monday for the example week.';
    status.textContent = error.message;
    download.disabled = true;
  }
}

start.addEventListener('change', refreshPreview);
unit.addEventListener('change', refreshPreview);
download.addEventListener('click', () => {
  try {
    const data = JSON.stringify(currentFile(), null, 2) + '\n';
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'form-plan-exchange-starter.json';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Your editable FORM file is ready.';
  } catch (error) {
    status.textContent = error.message;
  }
});

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(instructions.value);
    copyStatus.textContent = 'Instructions copied.';
  } catch {
    instructions.focus();
    instructions.select();
    copyStatus.textContent = 'Select and copy the highlighted text.';
  }
});

refreshPreview();
