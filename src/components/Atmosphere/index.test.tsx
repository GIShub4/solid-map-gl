import { render } from 'solid-testing-library'
import { Atmosphere } from './Atmosphere'

describe('Atmosphere', () => {
    it('should set the fog style on the map', () => {
        const mockSetFog = jest.fn()
        const mockMap = () => ({ setFog: mockSetFog })
        const fogStyle = { color: 'blue', intensity: 0.5 }

        render(() => <Atmosphere style={fogStyle} />, { wrapper: mockMap })

        expect(mockSetFog).toHaveBeenCalledWith(fogStyle)
    })

    it('should remove the fog style from the map on cleanup', () => {
        const mockSetFog = jest.fn()
        const mockMap = () => ({ setFog: mockSetFog })

        const { unmount } = render(() => <Atmosphere />, { wrapper: mockMap })
        unmount()

        expect(mockSetFog).toHaveBeenCalledWith(null)
    })
})