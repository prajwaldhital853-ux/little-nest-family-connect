import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PlayPauseButtonProps {
  paused: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}

export function PlayPauseButton( { paused, onToggle, label, className }: PlayPauseButtonProps ) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className={ cn( 'size-9 rounded-full', className ) }
      onClick={ onToggle }
      aria-label={ `${ paused ? 'Play' : 'Pause' } ${ label }` }
    >
      { paused ? <IconPlayerPlayFilled size={ 16 } /> : <IconPlayerPauseFilled size={ 16 } /> }
    </Button>
  );
}
