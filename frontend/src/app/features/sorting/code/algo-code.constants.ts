export type CodeLanguage = 'C++' | 'C' | 'Java' | 'Python' | 'C#' | 'JavaScript' | 'PHP';

export const CODE_LANGUAGES: CodeLanguage[] = ['C++', 'C', 'Java', 'Python', 'C#', 'JavaScript', 'PHP'];

export interface AlgoComplexity {
  best: string;
  average: string;
  worst: string;
  space: string;
}

export const ALGO_COMPLEXITY: Record<string, AlgoComplexity> = {
  'Bubble Sort': { best: 'O(n)',      average: 'O(n²)',     worst: 'O(n²)',        space: 'O(1)' },
  'Quick Sort':  { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)',      space: 'O(log n)' },
  'Merge Sort':  { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
  'Heap Sort':   { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
};

export const ALGO_CODE: Record<string, Record<string, string>> = {
  'Bubble Sort': {
    'C++': `void bubbleSort(int arr[], int n) {
  for (int i = 0; i < n - 1; i++) {
    bool swapped = false;
    for (int j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        swap(arr[j], arr[j + 1]);
        swapped = true;
      }
    }
    if (!swapped) break;
  }
}`,
    'C': `void bubbleSort(int arr[], int n) {
  for (int i = 0; i < n - 1; i++) {
    int swapped = 0;
    for (int j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        int tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
        swapped = 1;
      }
    }
    if (!swapped) break;
  }
}`,
    'Java': `void bubbleSort(int[] arr) {
  int n = arr.length;
  for (int i = 0; i < n - 1; i++) {
    boolean swapped = false;
    for (int j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        int tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
}`,
    'Python': `def bubble_sort(arr):
  n = len(arr)
  for i in range(n - 1):
    swapped = False
    for j in range(n - i - 1):
      if arr[j] > arr[j + 1]:
        arr[j], arr[j + 1] = arr[j + 1], arr[j]
        swapped = True
    if not swapped:
      break`,
    'C#': `void BubbleSort(int[] arr) {
  int n = arr.Length;
  for (int i = 0; i < n - 1; i++) {
    bool swapped = false;
    for (int j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        (arr[j], arr[j + 1]) = (arr[j + 1], arr[j]);
        swapped = true;
      }
    }
    if (!swapped) break;
  }
}`,
    'JavaScript': `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}`,
    'PHP': `function bubbleSort(array &$arr): void {
  $n = count($arr);
  for ($i = 0; $i < $n - 1; $i++) {
    $swapped = false;
    for ($j = 0; $j < $n - $i - 1; $j++) {
      if ($arr[$j] > $arr[$j + 1]) {
        [$arr[$j], $arr[$j + 1]] = [$arr[$j + 1], $arr[$j]];
        $swapped = true;
      }
    }
    if (!$swapped) break;
  }
}`,
  },

  'Quick Sort': {
    'C++': `int partition(int arr[], int low, int high) {
  int pivot = arr[high], i = low - 1;
  for (int j = low; j < high; j++)
    if (arr[j] <= pivot) swap(arr[++i], arr[j]);
  swap(arr[i + 1], arr[high]);
  return i + 1;
}
void quickSort(int arr[], int low, int high) {
  if (low < high) {
    int pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}`,
    'C': `int partition(int arr[], int low, int high) {
  int pivot = arr[high], i = low - 1, tmp;
  for (int j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      tmp = arr[++i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }
  tmp = arr[i+1]; arr[i+1] = arr[high]; arr[high] = tmp;
  return i + 1;
}
void quickSort(int arr[], int low, int high) {
  if (low < high) {
    int pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}`,
    'Java': `int partition(int[] arr, int low, int high) {
  int pivot = arr[high], i = low - 1;
  for (int j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      int tmp = arr[++i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }
  int tmp = arr[i+1]; arr[i+1] = arr[high]; arr[high] = tmp;
  return i + 1;
}
void quickSort(int[] arr, int low, int high) {
  if (low < high) {
    int pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
}`,
    'Python': `def quick_sort(arr, low, high):
  if low < high:
    pi = partition(arr, low, high)
    quick_sort(arr, low, pi - 1)
    quick_sort(arr, pi + 1, high)

def partition(arr, low, high):
  pivot = arr[high]
  i = low - 1
  for j in range(low, high):
    if arr[j] <= pivot:
      i += 1
      arr[i], arr[j] = arr[j], arr[i]
  arr[i+1], arr[high] = arr[high], arr[i+1]
  return i + 1`,
    'C#': `int Partition(int[] arr, int low, int high) {
  int pivot = arr[high], i = low - 1;
  for (int j = low; j < high; j++) {
    if (arr[j] <= pivot)
      (arr[++i], arr[j]) = (arr[j], arr[i]);
  }
  (arr[i+1], arr[high]) = (arr[high], arr[i+1]);
  return i + 1;
}
void QuickSort(int[] arr, int low, int high) {
  if (low < high) {
    int pi = Partition(arr, low, high);
    QuickSort(arr, low, pi - 1);
    QuickSort(arr, pi + 1, high);
  }
}`,
    'JavaScript': `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
}
function partition(arr, low, high) {
  const pivot = arr[high]; let i = low - 1;
  for (let j = low; j < high; j++)
    if (arr[j] <= pivot) [arr[++i], arr[j]] = [arr[j], arr[i]];
  [arr[i+1], arr[high]] = [arr[high], arr[i+1]];
  return i + 1;
}`,
    'PHP': `function quickSort(array &$arr, int $low, int $high): void {
  if ($low < $high) {
    $pi = partition($arr, $low, $high);
    quickSort($arr, $low, $pi - 1);
    quickSort($arr, $pi + 1, $high);
  }
}
function partition(array &$arr, int $low, int $high): int {
  $pivot = $arr[$high]; $i = $low - 1;
  for ($j = $low; $j < $high; $j++)
    if ($arr[$j] <= $pivot) [$arr[++$i], $arr[$j]] = [$arr[$j], $arr[$i]];
  [$arr[$i+1], $arr[$high]] = [$arr[$high], $arr[$i+1]];
  return $i + 1;
}`,
  },

  'Merge Sort': {
    'C++': `void merge(int arr[], int l, int m, int r) {
  vector<int> L(arr+l, arr+m+1), R(arr+m+1, arr+r+1);
  int i=0, j=0, k=l;
  while (i<L.size() && j<R.size())
    arr[k++] = (L[i]<=R[j]) ? L[i++] : R[j++];
  while (i<L.size()) arr[k++]=L[i++];
  while (j<R.size()) arr[k++]=R[j++];
}
void mergeSort(int arr[], int l, int r) {
  if (l < r) {
    int m = (l+r)/2;
    mergeSort(arr, l, m);
    mergeSort(arr, m+1, r);
    merge(arr, l, m, r);
  }
}`,
    'C': `void merge(int arr[], int l, int m, int r) {
  int i, j, k;
  int n1 = m-l+1, n2 = r-m;
  int L[n1], R[n2];
  for (i=0;i<n1;i++) L[i]=arr[l+i];
  for (j=0;j<n2;j++) R[j]=arr[m+1+j];
  i=j=0; k=l;
  while (i<n1 && j<n2)
    arr[k++] = L[i]<=R[j] ? L[i++] : R[j++];
  while (i<n1) arr[k++]=L[i++];
  while (j<n2) arr[k++]=R[j++];
}`,
    'Java': `void mergeSort(int[] arr, int l, int r) {
  if (l < r) {
    int m = (l + r) / 2;
    mergeSort(arr, l, m);
    mergeSort(arr, m + 1, r);
    merge(arr, l, m, r);
  }
}
void merge(int[] arr, int l, int m, int r) {
  int[] tmp = Arrays.copyOfRange(arr, l, r + 1);
  int i = 0, j = m - l + 1, k = l;
  while (i <= m - l && j < tmp.length)
    arr[k++] = tmp[i] <= tmp[j] ? tmp[i++] : tmp[j++];
  while (i <= m - l) arr[k++] = tmp[i++];
}`,
    'Python': `def merge_sort(arr):
  if len(arr) > 1:
    mid = len(arr) // 2
    L, R = arr[:mid], arr[mid:]
    merge_sort(L); merge_sort(R)
    i = j = k = 0
    while i < len(L) and j < len(R):
      if L[i] <= R[j]: arr[k] = L[i]; i += 1
      else:             arr[k] = R[j]; j += 1
      k += 1
    while i < len(L): arr[k] = L[i]; i += 1; k += 1
    while j < len(R): arr[k] = R[j]; j += 1; k += 1`,
    'C#': `void MergeSort(int[] arr, int l, int r) {
  if (l < r) {
    int m = (l + r) / 2;
    MergeSort(arr, l, m);
    MergeSort(arr, m + 1, r);
    Merge(arr, l, m, r);
  }
}
void Merge(int[] arr, int l, int m, int r) {
  var tmp = arr[l..(r+1)];
  int i=0, j=m-l+1, k=l;
  while (i<=m-l && j<tmp.Length)
    arr[k++] = tmp[i]<=tmp[j] ? tmp[i++] : tmp[j++];
  while (i<=m-l) arr[k++]=tmp[i++];
}`,
    'JavaScript': `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const L = mergeSort(arr.slice(0, mid));
  const R = mergeSort(arr.slice(mid));
  let i = 0, j = 0, k = 0;
  while (i < L.length && j < R.length)
    arr[k++] = L[i] <= R[j] ? L[i++] : R[j++];
  while (i < L.length) arr[k++] = L[i++];
  while (j < R.length) arr[k++] = R[j++];
  return arr;
}`,
    'PHP': `function mergeSort(array &$arr): void {
  $n = count($arr);
  if ($n <= 1) return;
  $mid = intdiv($n, 2);
  $L = array_slice($arr, 0, $mid);
  $R = array_slice($arr, $mid);
  mergeSort($L); mergeSort($R);
  $i = $j = $k = 0;
  while ($i < count($L) && $j < count($R))
    $arr[$k++] = $L[$i] <= $R[$j] ? $L[$i++] : $R[$j++];
  while ($i < count($L)) $arr[$k++] = $L[$i++];
  while ($j < count($R)) $arr[$k++] = $R[$j++];
}`,
  },

  'Heap Sort': {
    'C++': `void heapify(int arr[], int n, int i) {
  int largest = i, l = 2*i+1, r = 2*i+2;
  if (l<n && arr[l]>arr[largest]) largest=l;
  if (r<n && arr[r]>arr[largest]) largest=r;
  if (largest!=i) { swap(arr[i],arr[largest]); heapify(arr,n,largest); }
}
void heapSort(int arr[], int n) {
  for (int i=n/2-1;i>=0;i--) heapify(arr,n,i);
  for (int i=n-1;i>0;i--) { swap(arr[0],arr[i]); heapify(arr,i,0); }
}`,
    'C': `void heapify(int arr[], int n, int i) {
  int largest=i, l=2*i+1, r=2*i+2, tmp;
  if (l<n && arr[l]>arr[largest]) largest=l;
  if (r<n && arr[r]>arr[largest]) largest=r;
  if (largest!=i) {
    tmp=arr[i]; arr[i]=arr[largest]; arr[largest]=tmp;
    heapify(arr,n,largest);
  }
}
void heapSort(int arr[], int n) {
  for (int i=n/2-1;i>=0;i--) heapify(arr,n,i);
  for (int i=n-1;i>0;i--) {
    int tmp=arr[0]; arr[0]=arr[i]; arr[i]=tmp;
    heapify(arr,i,0);
  }
}`,
    'Java': `void heapSort(int[] arr) {
  int n = arr.length;
  for (int i=n/2-1;i>=0;i--) heapify(arr,n,i);
  for (int i=n-1;i>0;i--) {
    int tmp=arr[0]; arr[0]=arr[i]; arr[i]=tmp;
    heapify(arr,i,0);
  }
}
void heapify(int[] arr, int n, int i) {
  int largest=i, l=2*i+1, r=2*i+2;
  if (l<n && arr[l]>arr[largest]) largest=l;
  if (r<n && arr[r]>arr[largest]) largest=r;
  if (largest!=i) {
    int tmp=arr[i]; arr[i]=arr[largest]; arr[largest]=tmp;
    heapify(arr,n,largest);
  }
}`,
    'Python': `def heap_sort(arr):
  n = len(arr)
  for i in range(n//2-1, -1, -1):
    heapify(arr, n, i)
  for i in range(n-1, 0, -1):
    arr[0], arr[i] = arr[i], arr[0]
    heapify(arr, i, 0)

def heapify(arr, n, i):
  largest = i
  l, r = 2*i+1, 2*i+2
  if l < n and arr[l] > arr[largest]: largest = l
  if r < n and arr[r] > arr[largest]: largest = r
  if largest != i:
    arr[i], arr[largest] = arr[largest], arr[i]
    heapify(arr, n, largest)`,
    'C#': `void HeapSort(int[] arr) {
  int n = arr.Length;
  for (int i=n/2-1;i>=0;i--) Heapify(arr,n,i);
  for (int i=n-1;i>0;i--) {
    (arr[0], arr[i]) = (arr[i], arr[0]);
    Heapify(arr,i,0);
  }
}
void Heapify(int[] arr, int n, int i) {
  int largest=i, l=2*i+1, r=2*i+2;
  if (l<n && arr[l]>arr[largest]) largest=l;
  if (r<n && arr[r]>arr[largest]) largest=r;
  if (largest!=i) {
    (arr[i],arr[largest])=(arr[largest],arr[i]);
    Heapify(arr,n,largest);
  }
}`,
    'JavaScript': `function heapSort(arr) {
  const n = arr.length;
  for (let i=Math.floor(n/2)-1;i>=0;i--) heapify(arr,n,i);
  for (let i=n-1;i>0;i--) {
    [arr[0],arr[i]]=[arr[i],arr[0]];
    heapify(arr,i,0);
  }
  return arr;
}
function heapify(arr, n, i) {
  let largest=i, l=2*i+1, r=2*i+2;
  if (l<n && arr[l]>arr[largest]) largest=l;
  if (r<n && arr[r]>arr[largest]) largest=r;
  if (largest!==i) {
    [arr[i],arr[largest]]=[arr[largest],arr[i]];
    heapify(arr,n,largest);
  }
}`,
    'PHP': `function heapSort(array &$arr): void {
  $n = count($arr);
  for ($i=intdiv($n,2)-1;$i>=0;$i--) heapify($arr,$n,$i);
  for ($i=$n-1;$i>0;$i--) {
    [$arr[0],$arr[$i]]=[$arr[$i],$arr[0]];
    heapify($arr,$i,0);
  }
}
function heapify(array &$arr, int $n, int $i): void {
  $largest=$i; $l=2*$i+1; $r=2*$i+2;
  if ($l<$n && $arr[$l]>$arr[$largest]) $largest=$l;
  if ($r<$n && $arr[$r]>$arr[$largest]) $largest=$r;
  if ($largest!=$i) {
    [$arr[$i],$arr[$largest]]=[$arr[$largest],$arr[$i]];
    heapify($arr,$n,$largest);
  }
}`,
  },
};